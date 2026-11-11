"""Item do card Contexto."""

from typing import Literal

from pydantic import BaseModel

Kind = Literal["count", "percent", "permil", "years", "rate", "index", "year", "raw", "ratio"]


class NoteValue(BaseModel):
    key: str
    value: float | int | str
    kind: Kind


class ContextItem(BaseModel):
    id: str
    label: str
    value: float | int | str
    kind: Kind
    note: str | None = None
    note_values: list[NoteValue] | None = None
    chart_id: str
    chart_label: str
