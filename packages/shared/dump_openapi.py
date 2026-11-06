"""Grava o OpenAPI da API em packages/shared/openapi.json."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.main import app  # noqa: E402

TARGET = Path(__file__).resolve().parent / "openapi.json"
TARGET.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2), encoding="utf-8")
print(TARGET)
