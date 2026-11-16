"""O script de EDA reproduz os valores de referência da base completa."""

import pytest

from app.services.store import ParquetStore
from app.core.config import get_settings
from app.tools.eda import referencias
from tests.conftest import silver_completa

pytestmark = pytest.mark.full_data


def test_pico_cruzamento_e_obitos(monkeypatch):
    if not silver_completa():
        pytest.skip("base completa")
    import pandas as pd

    from tests.conftest import REPO

    monkeypatch.setenv("DATA_DIR", str(REPO / "data"))
    get_settings.cache_clear()
    store = ParquetStore(get_settings().silver_dir)
    ds1 = pd.read_parquet(store.latest_file("ds1", ".parquet"))
    ds3 = pd.read_parquet(store.latest_file("ds3", ".parquet"))
    ds4 = pd.read_parquet(store.latest_file("ds4", ".parquet"))
    found = referencias(ds1, ds3, ds4)
    assert found == {
        "pico_ano": 2041,
        "pico_pop": 220_425_299,
        "pop_2070": 199_228_708,
        "idosos_superam": 2029,
        "obitos_superam": 2042,
    }
