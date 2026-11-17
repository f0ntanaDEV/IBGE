"""O embed emite o token reduzido e não devolve o token amplo."""

import json

import httpx
import pytest

from app.core.errors import AppError
from app.integrations import databricks


class _Settings:
    databricks_host = "https://dbc-e7ffba4b-1a76.cloud.databricks.com"
    databricks_client_id = ""
    databricks_client_secret = ""
    service_principal_secret = "segredo"
    databricks_dashboard_id = ""


BROAD = "eyJhbGci.amplo.c2ln"
SCOPED = "eyJhbGci.reduzido.c2ln"


def _fake_http(monkeypatch, oidc_status: int = 200, access_token: str = BROAD):
    calls: list[tuple] = []

    def post(url, data=None, auth=None, timeout=None, headers=None, trust_env=None):
        calls.append(("post", url, dict(data), auth))
        token = access_token if data.get("scope") == "all-apis" else SCOPED
        return httpx.Response(
            oidc_status if data.get("scope") == "all-apis" else 200,
            json={"access_token": token, "expires_in": 3600},
            request=httpx.Request("POST", url),
        )

    def get(url, params=None, headers=None, timeout=None, trust_env=None):
        calls.append(("get", url, dict(params), headers["Authorization"]))
        return httpx.Response(
            200,
            json={
                "custom_claim": "urn:aibi:external_data:clevo-public:clevo-public-viewer:painel",
                "scope": "dashboards",
                "authorization_details": [{"type": "workspace_rule_set"}],
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(databricks.httpx, "post", post)
    monkeypatch.setattr(databricks.httpx, "get", get)
    monkeypatch.setattr(databricks, "get_settings", lambda: _Settings())
    return calls


def test_embed_devolve_so_o_token_reduzido(monkeypatch):
    calls = _fake_http(monkeypatch)
    body = databricks.embed_config()
    assert body["token"] == SCOPED
    assert body["mode"] == "external"
    assert body["workspace_id"] == databricks.WORKSPACE_ID
    assert body["dashboard_id"] == databricks.DASHBOARD_ID
    assert BROAD not in json.dumps(body)
    oidc = f"{_Settings.databricks_host}/oidc/v1/token?o={databricks.WORKSPACE_ID}"
    assert calls[0][1] == oidc
    assert calls[0][2] == {"grant_type": "client_credentials", "scope": "all-apis"}
    assert calls[0][3] == (databricks.CLIENT_ID, "segredo")
    assert calls[1][0] == "get"
    assert calls[1][1].endswith("/published/tokeninfo")
    assert calls[1][2]["external_viewer_id"] == "clevo-public-viewer"
    assert calls[1][2]["external_value"] == "clevo-public"
    assert calls[1][3] == f"Bearer {BROAD}"
    assert calls[2][2]["grant_type"] == "client_credentials"
    assert json.loads(calls[2][2]["authorization_details"]) == [{"type": "workspace_rule_set"}]
    assert calls[2][2]["scope"] == "dashboards"
    assert calls[2][2]["external_viewer_id"] == calls[1][2]["external_viewer_id"] == "clevo-public-viewer"
    assert calls[2][2]["external_value"] == calls[1][2]["external_value"] == "clevo-public"
    assert body["expires_in"] == 3600
    assert body["token"] != BROAD


def test_embed_nao_reaproveita_token(monkeypatch):
    calls = _fake_http(monkeypatch)
    databricks.embed_config()
    databricks.embed_config()
    assert [item[0] for item in calls].count("post") == 4


def test_passo1_sem_200_nao_chama_tokeninfo(monkeypatch):
    calls = _fake_http(monkeypatch, oidc_status=401)
    with pytest.raises(AppError) as exc:
        databricks.embed_config()
    assert exc.value.status_code == 503
    assert [item[0] for item in calls] == ["post"]


def test_access_token_invalido_nao_vai_como_bearer(monkeypatch):
    calls = _fake_http(monkeypatch, access_token="segredo")
    with pytest.raises(AppError) as exc:
        databricks.embed_config()
    assert exc.value.status_code == 503
    assert [item[0] for item in calls] == ["post"]


def test_embed_sem_segredo_responde_503(monkeypatch):
    settings = _Settings()
    settings.service_principal_secret = ""
    settings.databricks_client_secret = ""
    monkeypatch.setattr(databricks, "get_settings", lambda: settings)
    with pytest.raises(AppError) as exc:
        databricks.embed_config()
    assert exc.value.status_code == 503
