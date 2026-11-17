from pathlib import Path

from sqlalchemy import BigInteger, Float, Integer, Numeric

from app.repositories.schema import FACTS, RANGE_CHECKS, dim_dataset, dim_metrica, dim_territorio, etl_runs
from app.services.loader import BATCH
from app.tools.dump_ddl import render_ddl


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
    assert list(dim_territorio.c.regiao_cod.foreign_keys)[0].column.name == "cod"
    assert list(etl_runs.c.dataset_id.foreign_keys)[0].column.table.name == "dim_dataset"
    assert "id" in dim_dataset.c
    for name, table in FACTS.items():
        fks = list(table.c.cod.foreign_keys)
        assert len(fks) == 1
        assert fks[0].column.table.name == "dim_territorio"
        pk = [col.name for col in table.primary_key.columns]
        assert pk
        assert all(not col.nullable for col in table.primary_key.columns)
        names = {constraint.name for constraint in table.constraints}
        assert f"pk_{name}" in names
        assert f"ck_{name}_ano" in names
        assert not any(isinstance(col.type, Float) for col in table.columns)
        if "populacao" in table.c:
            assert isinstance(table.c.populacao.type, BigInteger)
        if "nqx" in table.c:
            assert isinstance(table.c.nqx.type, Numeric)
            assert f"ck_{name}_nqx" in names
        if name in {"ds1_populacao_idade", "ds5_tabuas_mortalidade"}:
            assert isinstance(table.c.idade.type, Integer)
            assert f"ck_{name}_idade" in names
    assert "ck_ds3_grupos_etarios_proporcoes" in dict(RANGE_CHECKS["ds3_grupos_etarios"])
    ds4 = dict(RANGE_CHECKS["ds4_indicadores"])
    assert "ck_ds4_indicadores_tft" in ds4
    assert "tcg_" not in " ".join(ds4.values())
    assert "ck_ds5_tabuas_mortalidade_ex" in dict(RANGE_CHECKS["ds5_tabuas_mortalidade"])


def test_ddl_bate_com_o_metadata():
    ddl = Path(__file__).resolve().parents[1].joinpath("sql", "ddl_ouro.sql").read_text(encoding="utf-8")
    assert ddl == render_ddl()
    assert "PRIMARY KEY" in ddl
    assert "CHECK" in ddl
    assert "fk_dim_territorio_regiao" in ddl
    assert "fk_etl_runs_dataset" in ddl
    assert "FLOAT" not in ddl
