from pathlib import Path

from app.repositories.schema import FACTS, dim_metrica, dim_territorio, etl_runs
from app.services.loader import BATCH


def test_schema_e_lotes():
    assert BATCH == 10_000
    assert set(FACTS) == {
        "ds1_populacao_idade",
        "ds2_populacao_quinquenal",
        "ds3_grupos_etarios",
        "ds4_indicadores",
        "ds5_tabuas_mortalidade",
    }
    assert dim_territorio.c.cod.autoincrement is False
    assert "report_json" in etl_runs.c
    assert "coluna" in dim_metrica.c
    assert list(dim_territorio.c.regiao_cod.foreign_keys) == []
    for table in FACTS.values():
        fks = list(table.c.cod.foreign_keys)
        assert len(fks) == 1
        assert fks[0].column.table.name == "dim_territorio"
        assert fks[0].column.name == "cod"
    ddl = Path(__file__).resolve().parents[1].joinpath("sql", "ddl_ouro.sql").read_text(encoding="utf-8")
    assert "FOREIGN KEY" in ddl
    assert "dim_territorio" in ddl
