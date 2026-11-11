"""Pré-calcula o Contexto (sexo total) nos anos de década e no ano corrente."""

import json

from app.core.config import get_settings
from app.domain.territory import REGIOES, UFS
from app.services.context.registry import PAGES

YEARS = [2000, 2010, 2020, 2026, 2030, 2040, 2050, 2060, 2070]


def main() -> None:
    folder = get_settings().data_dir / "cache" / "context"
    folder.mkdir(parents=True, exist_ok=True)
    codes = [0, *REGIOES.keys(), *UFS.keys()]
    for page, build in PAGES.items():
        for ano in YEARS:
            payload = {str(cod): [item.model_dump() for item in build(cod, ano, "t")] for cod in codes}
            path = folder / f"{page}_{ano}.json"
            path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            print(f"context {page} {ano} bytes={path.stat().st_size}", flush=True)


if __name__ == "__main__":
    main()
