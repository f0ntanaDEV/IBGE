import json

import httpx

from app.core.config import get_settings
from app.integrations.cache import ResponseCache
from app.integrations.http import fetch_json
from app.integrations.ibge_agregados import PROJECTION_2022, _population, censo_population, census_gap, read_censo_cache
from app.integrations.ibge_news import fetch_news


def test_cache_e_retry(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    settings = get_settings()
    cache = ResponseCache(tmp_path / "cache", settings.cache_ttl_s)
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(500)
        return httpx.Response(200, json={"items": [{"id": 7, "titulo": "Projeção"}]})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    payload, ok = fetch_json("https://exemplo.test/noticias", settings, cache, client, sleep=lambda _seconds: None)
    assert ok
    assert payload["items"][0]["id"] == 7
    payload, ok = fetch_json("https://exemplo.test/noticias", settings, cache, client, sleep=lambda _seconds: None)
    assert ok and calls["n"] == 2
    stored = json.loads(next((tmp_path / "cache").glob("*.json")).read_text(encoding="utf-8"))
    stored["fetched_at"] = 0
    next((tmp_path / "cache").glob("*.json")).write_text(json.dumps(stored), encoding="utf-8")

    def down(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(503)

    stale, ok = fetch_json(
        "https://exemplo.test/noticias",
        settings,
        cache,
        httpx.Client(transport=httpx.MockTransport(down)),
        sleep=lambda _seconds: None,
    )
    assert ok is False
    assert stale["items"][0]["titulo"] == "Projeção"
    news = fetch_news(
        ["projeção da população"],
        settings,
        cache,
        httpx.Client(
            transport=httpx.MockTransport(
                lambda _request: httpx.Response(
                    200,
                    json={
                        "items": [
                            {
                                "id": 1,
                                "titulo": "A",
                                "introducao": "",
                                "data_publicacao": "",
                                "link": "",
                                "editorias": "",
                                "imagens": "{\"image_intro\":\"images/agenciadenoticias/foto.jpg\"}",
                            }
                        ]
                    },
                )
            )
        ),
    )
    assert news["available"] is True
    assert news["items"][0]["titulo"] == "A"
    assert news["items"][0]["imagem"] == "https://agenciadenoticias.ibge.gov.br/images/agenciadenoticias/foto.jpg"
    get_settings.cache_clear()


def test_censo_com_referencia_em_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    settings = get_settings()
    body = [
        {
            "id": "93",
            "variavel": "População residente",
            "resultados": [{"series": [{"localidade": {"id": "1", "nivel": {"id": "N1"}}, "serie": {"2022": "203080756"}}]}],
        }
    ]
    meta = {
        "id": "4709",
        "periodicidade": {"inicio": 2022, "fim": 2022},
        "variaveis": [{"id": "93", "nome": "População residente", "unidade": "Pessoas"}],
    }
    assert _population(body) == 203080756
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if str(request.url).endswith("/metadados"):
            return httpx.Response(200, json=meta)
        return httpx.Response(200, json=body)

    cache = ResponseCache(tmp_path / "http", 10)
    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = censo_population(0, settings, cache, client)
    assert result["available"] is True
    assert result["censo"] == 203080756
    assert read_censo_cache(settings) == {"0": 203080756}
    assert round(census_gap(PROJECTION_2022, 203080756), 1) == 3.8
    again = censo_population(0, settings, cache, httpx.Client(transport=httpx.MockTransport(lambda _request: httpx.Response(500))))
    assert again["censo"] == 203080756
    assert calls["n"] == 2
    get_settings.cache_clear()
