"""Avaliação das regras de status. Os limites são parâmetros do painel."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel

PATH = Path(__file__).with_name("kpi_rules.yaml")
Status = Literal["good", "warn", "bad"]


class Band(BaseModel):
    gt: float | None = None
    gte: float | None = None
    lt: float | None = None
    lte: float | None = None

    def holds(self, value: float) -> bool:
        if self.gt is not None and not value > self.gt:
            return False
        if self.gte is not None and not value >= self.gte:
            return False
        if self.lt is not None and not value < self.lt:
            return False
        if self.lte is not None and not value <= self.lte:
            return False
        return True


class KpiRule(BaseModel):
    id: str
    metric_id: str
    basis: Literal["value", "yoy_pct", "vs_brazil", "delta10_pp", "delta10_rel", "pct_rows"]
    good: Band
    warn: Band
    action: str
    thresholds: str


@lru_cache
def load_rules() -> tuple[KpiRule, ...]:
    raw = yaml.safe_load(PATH.read_text(encoding="utf-8"))
    return tuple(KpiRule.model_validate(item) for item in raw)


def rule_by_id(rule_id: str) -> KpiRule:
    found = next((item for item in load_rules() if item.id == rule_id), None)
    if found is None:
        raise KeyError(rule_id)
    return found


def basis_value(rule: KpiRule, ctx: dict) -> float:
    if rule.basis == "yoy_pct":
        return float(ctx["yoy_pct"])
    if rule.basis == "vs_brazil":
        if ctx.get("brazil") is None:
            return float(ctx["value"]) - float(ctx["prev"])
        return float(ctx["value"]) - float(ctx["brazil"])
    if rule.basis == "delta10_pp":
        return float(ctx["delta10_pp"])
    if rule.basis == "delta10_rel":
        return float(ctx["delta10_rel"])
    return float(ctx["value"])


def evaluate(rule_id: str, ctx: dict) -> dict:
    rule = rule_by_id(rule_id)
    basis = basis_value(rule, ctx)
    status: Status = "good" if rule.good.holds(basis) else "warn" if rule.warn.holds(basis) else "bad"
    return {"status": status, "basis": basis}
