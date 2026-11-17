"""Fato calculado para uma página."""

from typing import Literal

from pydantic import BaseModel

Kind = Literal["count", "percent", "permil", "years", "rate", "index", "year", "raw"]
Status = Literal["good", "warn", "bad"]


class DetailPoint(BaseModel):
    """DetailPoint."""
    ano: int
    valor: float | int
    kind: Kind
    rotulo: str | None = None


class FactPart(BaseModel):
    """FactPart."""
    label: str | None = None
    value: float | int | str
    kind: Kind
    position: Literal["prefix", "suffix"] = "prefix"


class Fact(BaseModel):
    """Fact."""
    id: str
    label: str
    value: float | int | str
    kind: Kind
    detail: str | None = None
    detail_values: list[DetailPoint] | None = None
    parts: list[FactPart] = []
    reference_year: int | None = None
    status: Status | None = None
