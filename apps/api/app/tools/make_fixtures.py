"""Recorta fixtures de teste: Brasil, 1 região, 2 UFs e 3 anos, no máximo 200 linhas."""

from pathlib import Path

import pandas as pd

from app.core.config import API_ROOT, get_settings
from app.domain.dataset import DatasetConfig, load_catalog
from app.domain.territory import safe_name
from app.services.cleaning.reader import read_dataset
from app.tools.sheets import write_like_source

KEEP_COD = {0, 1, 11, 33}
KEEP_YEARS = {2022, 2023, 2024}
FIXTURES = API_ROOT / "tests" / "fixtures"


def cut_frame(frame: pd.DataFrame, cfg: DatasetConfig) -> pd.DataFrame:
    cod_col = next(column for column in frame.columns if safe_name(column) == "cod")
    selected = frame.loc[pd.to_numeric(frame[cod_col], errors="coerce").isin(KEEP_COD)].copy()
    if cfg.reshape is not None:
        years = [column for column in selected.columns if str(column) in {"2022", "2023", "2024"}]
        identities = [column for column in selected.columns if not (str(column).isdigit() and len(str(column)) == 4)]
        selected = selected[identities + years]
    else:
        ano_col = next(column for column in selected.columns if safe_name(column) == "ano")
        selected = selected.loc[pd.to_numeric(selected[ano_col], errors="coerce").isin(KEEP_YEARS)]
    idade_col = next((column for column in selected.columns if safe_name(column) == "idade"), None)
    if idade_col is not None:
        young = pd.to_numeric(selected[idade_col], errors="coerce").le(5)
        if int(young.sum()) > 0:
            selected = selected.loc[young]
    return selected.head(200).reset_index(drop=True)


def main() -> None:
    settings = get_settings()
    FIXTURES.mkdir(parents=True, exist_ok=True)
    for cfg in load_catalog().datasets:
        frame = read_dataset(settings.raw_dir / cfg.file, cfg)
        sample = cut_frame(frame, cfg)
        dest = FIXTURES / f"{cfg.id}.xlsx"
        write_like_source(sample, dest, cfg)
        print(f"{dest.name} rows={len(sample)}")


if __name__ == "__main__":
    main()
