"""Baixa a malha de UFs na API de Malhas do IBGE e grava um GeoJSON compacto.

A malha não é buscada em tempo de execução: o arquivo versionado fica em
`apps/web/public/geo/br-uf.json`.
"""

import gzip
import json
import urllib.request
from pathlib import Path

from app.domain.territory import UFS

IBGE_MALHA = (
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR"
    "?intrarregiao=UF&formato=application/vnd.geo%2Bjson&qualidade=minima"
)
MAX_BYTES = 150_000
DEST = Path(__file__).resolve().parents[4] / "apps" / "web" / "public" / "geo" / "br-uf.json"


def build(payload: bytes) -> dict:
    collection = json.loads(payload)
    features = []
    for feature in collection["features"]:
        cod = int(feature["properties"]["codarea"])
        if cod not in UFS:
            raise SystemExit(f"UF desconhecida na malha: {cod}")
        sigla, _nome = UFS[cod]
        features.append(
            {
                "type": "Feature",
                "properties": {"cod": cod, "sigla": sigla},
                "geometry": _rewind(_round_geometry(feature["geometry"])),
            }
        )
    features.sort(key=lambda item: item["properties"]["cod"])
    if len(features) != 27:
        raise SystemExit(f"A malha deveria ter 27 UFs e veio com {len(features)}")
    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    request = urllib.request.Request(IBGE_MALHA, headers={"User-Agent": "ibge-dashboard/build-geo"})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()
    if payload[:2] == b"\x1f\x8b":
        payload = gzip.decompress(payload)
    document = build(payload)
    encoded = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode()
    if len(encoded) > MAX_BYTES:
        raise SystemExit(f"Malha com {len(encoded)} bytes, acima de {MAX_BYTES}")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_bytes(encoded)
    print(f"{DEST} {len(encoded)} bytes {len(document['features'])} UFs")


def _round_geometry(geometry: dict) -> dict:
    kind = geometry["type"]
    if kind == "Polygon":
        coordinates = [_ring(ring) for ring in geometry["coordinates"]]
    elif kind == "MultiPolygon":
        coordinates = [[_ring(ring) for ring in polygon] for polygon in geometry["coordinates"]]
    else:
        raise SystemExit(f"Geometria não suportada: {kind}")
    return {"type": kind, "coordinates": coordinates}


def _signed_area(ring: list) -> float:
    total = 0.0
    for index in range(len(ring) - 1):
        lon, lat = ring[index]
        next_lon, next_lat = ring[index + 1]
        total += float(lon) * float(next_lat) - float(next_lon) * float(lat)
    return total


def _clockwise(ring: list, exterior: bool) -> list:
    """d3-geo trata o anel externo horário como interior de polígonos pequenos."""
    clockwise = _signed_area(ring) < 0
    if clockwise == exterior:
        return ring
    flipped = list(reversed(ring))
    if flipped and flipped[0] != flipped[-1]:
        flipped.append(flipped[0])
    return flipped


def _rewind(geometry: dict) -> dict:
    kind = geometry["type"]
    if kind == "Polygon":
        coordinates = [_clockwise(ring, index == 0) for index, ring in enumerate(geometry["coordinates"])]
    else:
        coordinates = [
            [_clockwise(ring, index == 0) for index, ring in enumerate(polygon)]
            for polygon in geometry["coordinates"]
        ]
    return {"type": kind, "coordinates": coordinates}


def _ring(ring: list) -> list:
    rounded = []
    for lon, lat in ring:
        point = [round(float(lon), 3), round(float(lat), 3)]
        if not rounded or point != rounded[-1]:
            rounded.append(point)
    if len(rounded) >= 2 and rounded[0] != rounded[-1]:
        rounded.append(rounded[0])
    return rounded


if __name__ == "__main__":
    main()
