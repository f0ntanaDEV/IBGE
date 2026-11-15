"""Modo de incorporação do painel Databricks. O padrão é a prévia, sem a tela de login."""

import time

import httpx

from app.core.config import get_settings
from app.core.errors import AppError

OPEN_URL = "https://dbc-e7ffba4b-1a76.cloud.databricks.com/embed/dashboardsv3/01f1e08bd1d71ca9b49a4604ee008ce0?o=7474648187013488"
_cache: dict[str, float | str] = {}


def embed_config() -> dict:
    settings = get_settings()
    mode = (settings.databricks_embed_mode or "preview").strip().lower()
    if mode not in {"external", "login", "preview"}:
        mode = "preview"
    if mode == "login":
        return {"mode": "login", "url": OPEN_URL}
    if mode == "external":
        token, expires = _service_token(settings)
        return {
            "mode": "external",
            "token": token,
            "instance_url": settings.databricks_host.rstrip("/"),
            "dashboard_id": settings.databricks_dashboard_id,
            "expires_at": expires,
        }
    return {"mode": "preview", "open_url": OPEN_URL}


def _service_token(settings) -> tuple[str, float]:
    if not all((settings.databricks_host, settings.databricks_client_id, settings.databricks_client_secret, settings.databricks_dashboard_id)):
        raise AppError("databricks_unconfigured", "O embed externo do Databricks não está configurado.", 503)
    cached = _cache.get("token")
    expires = float(_cache.get("expires") or 0)
    if isinstance(cached, str) and expires - time.time() > 300:
        return cached, expires
    host = settings.databricks_host.rstrip("/")
    try:
        response = httpx.post(
            f"{host}/oidc/v1/token",
            data={"grant_type": "client_credentials", "scope": "all-apis"},
            auth=(settings.databricks_client_id, settings.databricks_client_secret),
            timeout=8,
        )
        response.raise_for_status()
        access = response.json()["access_token"]
        published = httpx.post(
            f"{host}/api/2.0/lakeview/dashboards/{settings.databricks_dashboard_id}/published/embed-token",
            headers={"Authorization": f"Bearer {access}"},
            timeout=8,
        )
        published.raise_for_status()
        body = published.json()
    except (httpx.HTTPError, KeyError) as exc:
        raise AppError("databricks_unconfigured", "Não foi possível gerar o embed externo do Databricks.", 503) from exc
    token = str(body.get("token") or body.get("access_token") or "")
    if not token:
        raise AppError("databricks_unconfigured", "O Databricks não devolveu um token de embed.", 503)
    lifetime = float(body.get("expires_in") or 3600)
    deadline = time.time() + lifetime
    _cache["token"] = token
    _cache["expires"] = deadline
    return token, deadline
