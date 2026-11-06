"""Inspeção rápida: schema, nulos e 5 linhas. Uso: python -m app.tools.profile <arquivo>."""

import sys
from pathlib import Path

import pandas as pd

from app.domain.dataset import load_catalog
from app.services.cleaning.reader import read_dataset


def profile_frame(frame: pd.DataFrame) -> str:
    lines = [f"rows={len(frame)} cols={len(frame.columns)}", "column\tdtype\tnulls"]
    for col in frame.columns:
        lines.append(f"{col}\t{frame[col].dtype}\t{int(frame[col].isna().sum())}")
    lines.append("head5")
    lines.append(frame.head(5).to_csv(index=False).rstrip())
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> None:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        raise SystemExit("uso: python -m app.tools.profile <arquivo.xlsx>")
    path = Path(args[0])
    catalog = load_catalog()
    cfg = catalog.by_filename(path.name)
    if cfg is None:
        frame = pd.read_excel(path, engine="calamine")
    else:
        frame = read_dataset(path, cfg)
    print(profile_frame(frame))


if __name__ == "__main__":
    main()
