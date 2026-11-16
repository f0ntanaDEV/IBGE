"""Toda função e classe pública dos módulos da rubrica tem docstring."""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULES = [
    *sorted((ROOT / "app" / "services" / "cleaning").glob("*.py")),
    ROOT / "app" / "services" / "etl.py",
    ROOT / "app" / "services" / "loader.py",
    ROOT / "app" / "repositories" / "schema.py",
    *sorted((ROOT / "app" / "tools").glob("*.py")),
    *sorted((ROOT / "alembic" / "versions").glob("*.py")),
]


def test_funcoes_publicas_tem_docstring():
    missing = []
    for path in MODULES:
        if path.name.startswith("_"):
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                continue
            if node.name.startswith("_"):
                continue
            if ast.get_docstring(node):
                continue
            missing.append(f"{path.relative_to(ROOT)}:{node.name}")
    assert missing == []
