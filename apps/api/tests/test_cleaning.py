import pandas as pd
import pytest

from app.domain.dataset import load_catalog
from app.domain.territory import safe_name, territorios_padrao
from app.services.cleaning.duplicates import dedupe
from app.services.cleaning.missing import drop_sparse, fill_missing, recover_ids, structural_mask
from app.services.cleaning.outliers import apply_outliers
from app.services.cleaning.pipeline import run_frame
from app.services.cleaning.validate import validate
from app.tools.make_dirty import dirty_frame


def test_safe_name_e_territorios():
    assert safe_name("CÓD.") == "cod"
    assert safe_name("GRUPO ETÁRIO") == "grupo_etario"
    assert safe_name("90+") == "n_90_mais"
    assert safe_name("2000") == "2000"
    assert safe_name("0-14_T") == "n_0_14_t"
    assert len(territorios_padrao()) == 33


def test_catalogo_tem_cinco_datasets():
    catalog = load_catalog()
    assert [item.id for item in catalog.datasets] == ["ds1", "ds2", "ds3", "ds4", "ds5"]
    assert catalog.get("ds4").structural_nulls[0].columns == ["tcg_t", "tcg_h", "tcg_m"]


def test_interpola_serie_e_preserva_nulo_estrutural():
    frame = pd.DataFrame(
        {
            "cod": [11, 11, 11, 11],
            "ano": [2000, 2001, 2002, 2003],
            "nivel": ["uf"] * 4,
            "populacao": [10.0, pd.NA, 30.0, 40.0],
            "tcg_t": [pd.NA, 1.0, 2.0, 3.0],
        }
    )
    cfg = load_catalog().get("ds1")
    cfg4 = load_catalog().get("ds4")
    masks = structural_mask(frame.assign(ano=frame["ano"]), cfg4)
    metrics = [{"coluna": "populacao"}, {"coluna": "tcg_t"}]
    filled = fill_missing(frame, cfg4, metrics, masks)
    assert filled.loc[filled["ano"] == 2001, "populacao"].iloc[0] == pytest.approx(20)
    assert pd.isna(filled.loc[filled["ano"] == 2000, "tcg_t"].iloc[0])


def test_mediana_quando_a_serie_inteira_falta():
    frame = pd.DataFrame(
        {
            "cod": [11, 11, 33, 33],
            "ano": [2020, 2021, 2020, 2021],
            "nivel": ["uf"] * 4,
            "populacao": [pd.NA, pd.NA, 8.0, 12.0],
        }
    )
    metrics = [{"coluna": "populacao"}]
    filled = fill_missing(frame, load_catalog().get("ds1"), metrics, {})
    assert float(filled.loc[filled["cod"] == 11, "populacao"].iloc[0]) == pytest.approx(8)


def test_recupera_sigla_e_descarta_idade_nula():
    frame = pd.DataFrame(
        {
            "idade": [0, 1, pd.NA],
            "sexo": ["Ambos", "Ambos", "Ambos"],
            "cod": [11, 11, 11],
            "sigla": [pd.NA, "RO", "RO"],
            "local": ["Rondônia", "Rondônia", "Rondônia"],
            "ano": [2024, 2024, 2024],
        }
    )
    result, discarded = recover_ids(frame, load_catalog().get("ds1"))
    assert discarded == 1
    assert result.iloc[0]["sigla"] == "RO"
    assert len(result) == 2


def test_descarta_coluna_esparsa():
    frame = pd.DataFrame({"cod": [1, 1], "ano": [2020, 2021], "populacao": [1.0, pd.NA], "ruido": [pd.NA, pd.NA]})
    metrics = [{"coluna": "populacao"}, {"coluna": "ruido"}]
    _frame, kept, dropped = drop_sparse(frame, load_catalog().get("ds1"), metrics, 0.6)
    assert dropped == ["ruido"]
    assert [item["coluna"] for item in kept] == ["populacao"]


def test_dedupe_exata_e_por_chave_preserva_brasil():
    frame = pd.DataFrame(
        {
            "idade": [0, 0, 0, 0],
            "sexo": ["Ambos"] * 4,
            "cod": [11, 11, 11, 0],
            "ano": [2024, 2024, 2024, 2024],
            "populacao": [10.0, 10.0, 99.0, 10.0],
            "extra": [1, 1, pd.NA, 1],
        }
    )
    nulls = frame.isna().sum(axis=1)
    result, counts = dedupe(frame, load_catalog().get("ds1"), nulls)
    assert counts == {"exact": 1, "key": 1}
    assert set(result["cod"]) == {0, 11}
    assert float(result.loc[result["cod"] == 11, "populacao"].iloc[0]) == 10


def test_outlier_iqr_cap_e_dominio_da_tabua():
    years = list(range(2000, 2008))
    frame = pd.DataFrame(
        {
            "cod": [11] * 8,
            "sexo": ["Ambos"] * 8,
            "idade": [0] * 8,
            "ano": years,
            "populacao": [100, 110, 121, 133, 146, 160, 176, 1760],
        }
    )
    cleaned, counts = apply_outliers(
        frame, load_catalog().get("ds1"), [{"coluna": "populacao"}], "iqr_delta", 3.0, "cap"
    )
    assert counts["populacao"]["iqr_delta"] >= 1
    assert cleaned.iloc[-1]["populacao"] < 500
    assert bool(cleaned.iloc[-1]["is_outlier"])

    life = pd.DataFrame(
        {
            "cod": [0, 0],
            "sexo": ["Ambos", "Ambos"],
            "idade": [0, 1],
            "ano": [2022, 2022],
            "nqx": [1.2, 0.1],
            "lx": [100.0, 110.0],
            "ex": [-1.0, 70.0],
        }
    )
    flagged, domain_counts = apply_outliers(
        life, load_catalog().get("ds5"), [{"coluna": "nqx"}, {"coluna": "lx"}, {"coluna": "ex"}], "iqr_delta", 3, "flag"
    )
    assert domain_counts["nqx"]["dominio"] == 1
    assert domain_counts["lx"]["dominio"] == 1
    assert domain_counts["ex"]["dominio"] == 1
    assert bool(flagged["is_outlier"].all())


def test_validacao_territorial_e_sexo():
    frame = pd.DataFrame(
        {
            "cod": [0, 1, 2, 11, 33],
            "nivel": ["brasil", "regiao", "regiao", "uf", "uf"],
            "ano": [2024] * 5,
            "sexo": ["Ambos"] * 5,
            "idade": [0] * 5,
            "populacao": [10, 4, 6, 3, 7],
            "pop_t": [10, 4, 6, 3, 7],
            "pop_h": [4, 1, 3, 1, 3],
            "pop_m": [6, 3, 3, 2, 4],
        }
    )
    checks = {item["rule"]: item for item in validate(frame, load_catalog().get("ds3"))}
    assert checks["brasil_eq_regioes:populacao"]["ok"]
    assert checks["brasil_eq_ufs:populacao"]["ok"]
    assert checks["h_mais_m:pop"]["ok"]


def test_pipeline_recupera_serie_linear_suja():
    rows = []
    for cod, sigla, local, _nivel in ((0, "BR", "Brasil", "brasil"), (11, "RO", "Rondônia", "uf")):
        row = {"IDADE": 0, "SEXO": "Ambos", "CÓD.": cod, "SIGLA": sigla, "LOCAL": local}
        for ano in range(2000, 2011):
            row[str(ano)] = 1000 + (ano - 2000) * 20
        rows.append(row)
    clean = pd.DataFrame(rows)
    cfg = load_catalog().get("ds1")
    original, _metrics, _report = run_frame(clean, cfg, source="original")
    dirty = dirty_frame(clean, cfg, seed=42)
    recovered, _metrics, report = run_frame(
        dirty, cfg, source="sujo", outlier_strategy="cap"
    )
    merged = original.merge(recovered, on=["cod", "ano", "sexo", "idade"], suffixes=("_o", "_r"))
    error = (merged["populacao_o"] - merged["populacao_r"]).abs()
    assert report.duplicates_removed["exact"] >= 1
    assert report.duplicates_removed["key"] >= 1
    assert float(error.median()) == 0
    assert float(error.mean()) < 25


def test_reshape_grupo_e_intervalo(tmp_path):
    from app.services.cleaning.pipeline import prepare

    wide = pd.DataFrame(
        {
            "GRUPO ETÁRIO": [" 00-04", "90+"],
            "SEXO": ["Ambos", "Ambos"],
            "CÓD.": [0, 0],
            "SIGLA": ["BR", "BR"],
            "LOCAL": ["Brasil", "Brasil"],
            "2024": [10, 5],
        }
    )
    shaped, metrics = prepare(wide, load_catalog().get("ds2"))
    assert list(shaped["grupo_etario"]) == ["00-04", "90+"]
    assert list(shaped["idade_inicio"]) == [0, 90]
    assert metrics[0]["coluna"] == "populacao"
    life = pd.DataFrame(
        {
            "IDADE": [90],
            "INTERVALO DE IDADE": ["+"],
            "SEXO": ["Ambos"],
            "ANO": [2024],
            "CÓD.": [0],
            "SIGLA": ["BR"],
            "LOCAL": ["Brasil"],
            "nMx": [0.2],
            "nAx": [0.5],
            "nqx": [1],
            "lx": [100],
            "ndx": [1],
            "nLx": [50],
            "Sx": [0],
            "Tx": [50],
            "ex": [0.5],
        }
    )
    tabua, _metrics = prepare(life, load_catalog().get("ds5"))
    assert bool(tabua.iloc[0]["intervalo_aberto"])
    assert pd.isna(tabua.iloc[0]["intervalo"])
    assert tabua.iloc[0]["nivel"] == "brasil"
