"""Token de embed do Lakeview para visitante externo. O token amplo não sai do servidor."""

import json
import logging
import re
import uuid

import httpx

from app.core.config import get_settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

INSTANCE_URL = "https://dbc-e7ffba4b-1a76.cloud.databricks.com"
WORKSPACE_ID = "7474648187013488"
DASHBOARD_ID = "01f1e08bd1d71ca9b49a4604ee008ce0"
CLIENT_ID = "dcabf4c5-5541-46a8-853d-f22b2baed7a3"
EXTERNAL_VALUE = "publico"
_VIEWER = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def embed_config(external_viewer_id: str = "") -> dict:
    """Token reduzido para o browser. Cada chamada emite um token novo."""
    viewer = _viewer(external_viewer_id)
    settings = get_settings()
    secret = (settings.databricks_client_secret or "").strip()
    if not secret:
        raise AppError(
            "databricks_unconfigured",
            "O embed externo do Databricks não está configurado.",
            503,
        )
    host = (settings.databricks_host or INSTANCE_URL).rstrip("/")
    client_id = (settings.databricks_client_id or CLIENT_ID).strip()
    dashboard_id = (settings.databricks_dashboard_id or DASHBOARD_ID).strip()
    token, expires_in = _scoped_token(host, client_id, secret, dashboard_id, viewer)
    return {
        "mode": "external",
        "token": token,
        "instance_url": host,
        "workspace_id": WORKSPACE_ID,
        "dashboard_id": dashboard_id,
        "expires_in": expires_in,
    }


def _viewer(raw: str) -> str:
    """Identificador opaco. E-mail e outros dados pessoais não entram no token."""
    value = (raw or "").strip() or uuid.uuid4().hex
    if not _VIEWER.fullmatch(value):
        raise AppError(
            "databricks_viewer",
            "O identificador do visitante precisa ser opaco, sem dados pessoais.",
            400,
        )
    return value


def _form_value(value: object) -> str:
    """Campo de form. Objetos vão como JSON compacto, no formato do JSON.stringify."""
    if isinstance(value, str):
        return value
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def _jwt(payload: object, secret: str) -> str:
    """Só o access_token. Segredo, JSON bruto ou valor vazio não seguem para o passo 2."""
    if not isinstance(payload, dict):
        raise ValueError("resposta oidc")
    token = payload.get("access_token")
    if not isinstance(token, str):
        raise ValueError("access_token")
    token = "".join(token.split())
    if (
        not token
        or token == secret
        or token.startswith("{")
        or not token.startswith("eyJ")
        or token.count(".") != 2
    ):
        raise ValueError("access_token")
    return token


def _log_http(step: str, response: httpx.Response, secret: str) -> None:
    """Corpo do erro, sem segredo e sem token."""
    text = response.text[:500].replace(secret, "***")
    text = re.sub(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "***", text)
    logger.warning("databricks %s status=%s body=%s", step, response.status_code, text)


def _scoped_token(host: str, client_id: str, secret: str, dashboard_id: str, viewer: str) -> tuple[str, int]:
    oidc = f"{host}/oidc/v1/token?o={WORKSPACE_ID}"
    auth = (client_id, secret)
    try:
        broad = httpx.post(
            oidc,
            data={"grant_type": "client_credentials", "scope": "all-apis"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=auth,
            timeout=20,
            trust_env=False,
        )
        if broad.status_code != 200:
            _log_http("oidc", broad, secret)
            raise ValueError("oidc")
        access = _jwt(broad.json(), secret)
        info = httpx.get(
            f"{host}/api/2.0/lakeview/dashboards/{dashboard_id}/published/tokeninfo",
            params={
                "o": WORKSPACE_ID,
                "external_viewer_id": viewer,
                "external_value": EXTERNAL_VALUE,
            },
            headers={"Authorization": f"Bearer {access}", "Accept": "application/json"},
            timeout=20,
            trust_env=False,
        )
        if info.status_code != 200:
            _log_http("tokeninfo", info, secret)
            raise ValueError("tokeninfo")
        payload = dict(info.json())
        details = payload.pop("authorization_details", None)
        form = {key: _form_value(value) for key, value in payload.items()}
        form["grant_type"] = "client_credentials"
        form["authorization_details"] = _form_value(details)
        form["external_viewer_id"] = viewer
        form["external_value"] = EXTERNAL_VALUE
        scoped = httpx.post(
            oidc,
            data=form,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=auth,
            timeout=20,
            trust_env=False,
        )
        if scoped.status_code != 200:
            _log_http("oidc_scoped", scoped, secret)
            raise ValueError("oidc_scoped")
        body = scoped.json()
        token = _jwt(body, secret)
        if token == access:
            raise ValueError("token amplo")
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise AppError(
            "databricks_unconfigured",
            "Não foi possível gerar o embed externo do Databricks.",
            503,
        ) from exc
    return token, int(body.get("expires_in") or 3600)
