"""Dicionário único de métricas, validado na carga."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field

PATH = Path(__file__).with_name("metricas.yaml")


class Metrica(BaseModel):
    id: str
    nome: str
    sigla: str = ""
    definicao: str
    formula: str
    unidade: str = ""
    casas_decimais: int = Field(ge=0, le=4)
    tipo_variacao: Literal["relativa", "pontos", "absoluta"]
    fonte: str
    regra_status: str


@lru_cache
def load_metricas() -> tuple[Metrica, ...]:
    raw = yaml.safe_load(PATH.read_text(encoding="utf-8"))
    items = [Metrica.model_validate(item) for item in raw]
    ids = [item.id for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError("métrica repetida no dicionário")
    return tuple(items)
