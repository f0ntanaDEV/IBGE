"""Tolerância das regras de validação. Estoque exige igualdade; fluxo aceita o arredondamento da fonte."""

from dataclasses import dataclass
from typing import Literal

Status = Literal["ok", "ok_arredondamento", "falha"]
DUST = 1e-6


@dataclass(frozen=True)
class Rule:
    """Rule."""
    id: str
    dataset: str
    kind: Literal["estoque", "fluxo"]
    tol_abs: float = 0
    tol_rel: float = 0
    note: str | None = None


def rule_for(rule_id: str, dataset: str = "") -> Rule:
    """Entra: rule_id, dataset. Sai com o resultado de rule for."""
    column = rule_id.split(":", 1)[-1]
    if column.startswith(("nasc", "obt")):
        return Rule(rule_id, dataset, "fluxo", tol_abs=10, tol_rel=0.00001, note="arredondamento da fonte IBGE")
    if column.startswith("p_") or column == "p":
        return Rule(rule_id, dataset, "estoque", tol_abs=0.05)
    return Rule(rule_id, dataset, "estoque")


def evaluate(rule: Rule, max_diff_abs: float, reference: float = 0) -> Status:
    """Entra: rule, max_diff_abs, reference. Sai com o resultado de evaluate."""
    diff = abs(float(max_diff_abs or 0))
    if diff <= DUST:
        return "ok"
    limit = max(rule.tol_abs, rule.tol_rel * abs(reference))
    if diff <= limit:
        return "ok_arredondamento" if rule.note else "ok"
    return "falha"
