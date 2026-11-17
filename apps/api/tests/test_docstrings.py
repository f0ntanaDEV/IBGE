"""Docstrings de app/ e das revisões do Alembic."""

from pathlib import Path

from app.tools.doc_coverage import missing_public, python_files, summarize

ROOT = Path(__file__).resolve().parents[1]


def test_funcoes_publicas_tem_docstring():
    paths = python_files(ROOT / "app") + python_files(ROOT / "alembic" / "versions")
    assert missing_public(paths) == []


def test_cobertura_de_docstring():
    _have, percent, _folders = summarize(ROOT / "app")
    assert percent >= 90
