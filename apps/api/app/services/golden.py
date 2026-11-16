"""Valores de referência da carga ouro. Cada dataset só confere o que a tabela dele contém."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import text

# Nascimentos e óbitos aceitam o arredondamento da fonte: até 10 pessoas ou 0,001%.
FLUXO_TOL_ABS = 10
FLUXO_TOL_REL = Decimal("0.00001")

ROW_COUNTS = {
    "ds1": 639_639,
    "ds2": 133_551,
    "ds3": 2_343,
    "ds4": 2_343,
    "ds5": 140_580,
}
TOTAL_ROWS = 918_456
TABLES = {
    "ds1": "ds1_populacao_idade",
    "ds2": "ds2_populacao_quinquenal",
    "ds3": "ds3_grupos_etarios",
    "ds4": "ds4_indicadores",
    "ds5": "ds5_tabuas_mortalidade",
}


class GoldenMismatch(RuntimeError):
    """Diferença entre o MySQL e um valor de referência. A transação da carga deve desfazer."""

    def __init__(self, dataset_id: str, failures: list[str]) -> None:
        self.dataset_id = dataset_id
        self.failures = failures
        super().__init__(f"{dataset_id}: " + "; ".join(failures))


@dataclass(frozen=True)
class Check:
    name: str
    sql: str
    expected: Decimal
    kind: str


def default_references(dataset_id: str) -> dict:
    """Referências da base completa. Contagens exigem igualdade; e0 e TFT, 2 casas."""
    refs: dict = {"rows": ROW_COUNTS[dataset_id]}
    if dataset_id == "ds1":
        refs["brasil_2026"] = 214_211_951
        refs["brasil_2024"] = 212_583_750
        refs["outliers"] = 0
    if dataset_id == "ds4":
        refs["pop_t_2026"] = 214_211_951
        refs["e0_t_2026"] = Decimal("77.03")
        refs["tft_2026"] = Decimal("1.51")
        refs["nulos_tcg"] = 99
    if dataset_id == "ds5":
        refs["total_rows"] = TOTAL_ROWS
    return refs


def validate_golden(connection, dataset_id: str, references: dict | None = None) -> None:
    """Confere os SELECTs na transação aberta. Divergência levanta GoldenMismatch."""
    refs = default_references(dataset_id) if references is None else references
    failures = []
    for check in _checks(dataset_id, refs):
        found = connection.execute(text(check.sql)).scalar()
        if not _matches(check.kind, found, check.expected):
            failures.append(f"{check.name}: encontrado {found}, esperado {check.expected}")
    if failures:
        raise GoldenMismatch(dataset_id, failures)


def _checks(dataset_id: str, refs: dict) -> list[Check]:
    table = TABLES[dataset_id]
    ambos = f"cod = 0 AND ano = {{ano}} AND sexo = 'Ambos'"
    items: list[Check] = []
    if "rows" in refs:
        items.append(Check("linhas", f"SELECT COUNT(*) FROM {table}", Decimal(refs["rows"]), "exact"))
    if dataset_id == "ds1" and "brasil_2026" in refs:
        items.append(Check(
            "brasil_2026",
            f"SELECT SUM(populacao) FROM {table} WHERE {ambos.format(ano=2026)}",
            Decimal(refs["brasil_2026"]),
            "exact",
        ))
    if dataset_id == "ds1" and "brasil_2024" in refs:
        items.append(Check(
            "brasil_2024",
            f"SELECT SUM(populacao) FROM {table} WHERE {ambos.format(ano=2024)}",
            Decimal(refs["brasil_2024"]),
            "exact",
        ))
    if dataset_id == "ds1" and "outliers" in refs:
        items.append(Check(
            "outliers",
            f"SELECT COUNT(*) FROM {table} WHERE is_outlier = 1",
            Decimal(refs["outliers"]),
            "exact",
        ))
    if dataset_id == "ds4" and "pop_t_2026" in refs:
        items.append(Check(
            "pop_t_2026",
            f"SELECT pop_t FROM {table} WHERE cod = 0 AND ano = 2026",
            Decimal(refs["pop_t_2026"]),
            "exact",
        ))
    if dataset_id == "ds4" and "e0_t_2026" in refs:
        items.append(Check(
            "e0_t_2026",
            f"SELECT e0_t FROM {table} WHERE cod = 0 AND ano = 2026",
            Decimal(str(refs["e0_t_2026"])),
            "round2",
        ))
    if dataset_id == "ds4" and "tft_2026" in refs:
        items.append(Check(
            "tft_2026",
            f"SELECT tft FROM {table} WHERE cod = 0 AND ano = 2026",
            Decimal(str(refs["tft_2026"])),
            "round2",
        ))
    if dataset_id == "ds4" and "nulos_tcg" in refs:
        # 33 territórios em 2000 × tcg_t/h/m = 99 nulos estruturais.
        items.append(Check(
            "nulos_tcg",
            f"SELECT COALESCE(SUM((tcg_t IS NULL) + (tcg_h IS NULL) + (tcg_m IS NULL)), 0) "
            f"FROM {table} WHERE ano = 2000",
            Decimal(refs["nulos_tcg"]),
            "exact",
        ))
    if "total_rows" in refs:
        parts = " + ".join(f"(SELECT COUNT(*) FROM {name})" for name in TABLES.values())
        items.append(Check("total", f"SELECT {parts}", Decimal(refs["total_rows"]), "exact"))
    if "fluxo" in refs:
        items.append(Check("fluxo", str(refs["fluxo"]["sql"]), Decimal(str(refs["fluxo"]["expected"])), "fluxo"))
    return items


def _matches(kind: str, found: object, expected: Decimal) -> bool:
    if found is None:
        return False
    value = Decimal(str(found))
    if kind == "round2":
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) == expected.quantize(Decimal("0.01"))
    if kind == "fluxo":
        limit = max(Decimal(FLUXO_TOL_ABS), FLUXO_TOL_REL * abs(expected))
        return abs(value - expected) <= limit
    return value == expected
