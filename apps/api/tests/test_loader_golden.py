"""Carga ouro em SQLite: suja fora das fatos, troca sempre e rollback do golden."""

import pandas as pd
from sqlalchemy import create_engine, text

from app.domain.report import QualityReport
from app.services.golden import GoldenMismatch, _matches
from app.services.loader import load_mysql
from decimal import Decimal


def _report(dataset_id: str = "ds1", source: str = "original") -> QualityReport:
    return QualityReport(
        dataset_id=dataset_id,
        source=source,
        rows_before=3,
        rows_after=3,
        nulls_before={},
        nulls_after={},
        structural_nulls={},
        duplicates_removed={},
        outliers={},
        columns_dropped=[],
        rows_discarded=0,
        validations=[],
        strategies={},
        duration_s=0,
    )


def _frame(populacao: int = 4) -> pd.DataFrame:
    frame = pd.DataFrame(
        [
            _row(2026, 0, populacao),
            _row(2026, 1, 6),
            _row(2024, 0, 5),
        ]
    )
    # Mesma ordem da silver: nivel é derivado depois do melt.
    return frame[
        ["idade", "sexo", "cod", "sigla", "local", "ano", "populacao", "nivel", "is_outlier", "outlier_motivo"]
    ]


def _row(ano: int, idade: int, populacao: int, outlier: bool = False) -> dict:
    return {
        "idade": idade,
        "sexo": "Ambos",
        "cod": 0,
        "sigla": "BR",
        "local": "Brasil",
        "nivel": "brasil",
        "ano": ano,
        "populacao": populacao,
        "is_outlier": outlier,
        "outlier_motivo": None,
    }


REFS = {"rows": 3, "brasil_2026": 10, "brasil_2024": 5, "outliers": 0}


def test_fluxo_aceita_dez_pessoas():
    assert _matches("fluxo", 100, Decimal(110))
    assert not _matches("fluxo", 100, Decimal(120))


def test_suja_nao_entra_e_original_substitui():
    engine = create_engine("sqlite://")
    load_mysql(engine, _frame(), "ds1_populacao_idade", "ds1", "original", _report(), [], REFS)
    dirty = _frame(999)
    dirty["is_outlier"] = True
    load_mysql(engine, dirty, "ds1_populacao_idade", "ds1", "sujo", _report(source="sujo"), [], REFS)
    with engine.connect() as connection:
        total = connection.execute(text("SELECT SUM(populacao) FROM ds1_populacao_idade WHERE ano = 2026")).scalar()
        outliers = connection.execute(text("SELECT COUNT(*) FROM ds1_populacao_idade WHERE is_outlier = 1")).scalar()
        sources = connection.execute(text("SELECT source, status FROM etl_runs ORDER BY id")).all()
    assert int(total) == 10
    assert int(outliers) == 0
    assert ("sujo", "success") in [(row[0], row[1]) for row in sources]
    load_mysql(engine, _frame(7), "ds1_populacao_idade", "ds1", "original", _report(), [], {**REFS, "brasil_2026": 13})
    with engine.connect() as connection:
        total = connection.execute(text("SELECT SUM(populacao) FROM ds1_populacao_idade WHERE ano = 2026")).scalar()
        runs = connection.execute(text("SELECT COUNT(*) FROM etl_runs WHERE source = 'original' AND status = 'success'")).scalar()
    assert int(total) == 13
    assert int(runs) == 2


def test_rollback_quando_o_golden_diverge():
    engine = create_engine("sqlite://")
    load_mysql(engine, _frame(), "ds1_populacao_idade", "ds1", "original", _report(), [], REFS)
    try:
        load_mysql(engine, _frame(1), "ds1_populacao_idade", "ds1", "original", _report(), [], {**REFS, "brasil_2026": 999})
    except GoldenMismatch as exc:
        assert "brasil_2026" in str(exc)
    else:
        raise AssertionError("a carga deveria falhar")
    with engine.connect() as connection:
        total = connection.execute(text("SELECT SUM(populacao) FROM ds1_populacao_idade WHERE ano = 2026")).scalar()
        failed = connection.execute(text("SELECT error FROM etl_runs WHERE status = 'failed'")).scalar()
    assert int(total) == 10
    assert "brasil_2026" in failed
