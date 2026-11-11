"""Data da execução a partir do nome do relatório."""

import re
from datetime import datetime
from pathlib import Path


def finished_from_name(path: Path) -> datetime | None:
    match = re.search(r"_(\d{8})T(\d{6})", path.name)
    if not match:
        return None
    return datetime.strptime(match.group(1) + match.group(2), "%Y%m%d%H%M%S")
