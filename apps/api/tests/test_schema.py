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
