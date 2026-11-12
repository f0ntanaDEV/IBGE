"""Relógio do painel: o servidor grava UTC sem fuso; a tela mostra Brasília."""

from datetime import datetime
from zoneinfo import ZoneInfo

UTC = ZoneInfo("UTC")
BRASILIA = ZoneInfo("America/Sao_Paulo")


def as_brasilia(value: datetime | str | None) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, str):
        text = value.strip().replace("Z", "+00:00")
        value = datetime.fromisoformat(text)
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(BRASILIA)


def stamp_iso(value: datetime | str | None) -> str | None:
    zoned = as_brasilia(value)
    if zoned is None:
        return None
    return zoned.isoformat(timespec="minutes")
