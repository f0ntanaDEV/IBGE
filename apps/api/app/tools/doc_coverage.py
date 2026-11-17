"""Conta funções e classes com docstring em app/."""

import ast
from pathlib import Path


def python_files(root: Path) -> list[Path]:
    """Arquivos Python da pasta, inclusive os que começam com sublinhado."""
    return sorted(path for path in root.rglob("*.py") if path.is_file())


def definitions(path: Path) -> list[ast.AST]:
    """Funções, funções assíncronas e classes do arquivo."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return [
        node
        for node in ast.walk(tree)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
    ]


def missing_public(paths: list[Path]) -> list[str]:
    """Nomes públicos sem docstring, no formato caminho:nome."""
    missing = []
    for path in paths:
        for node in definitions(path):
            if node.name.startswith("_") or ast.get_docstring(node):
                continue
            missing.append(f"{path}:{node.name}")
    return missing


def summarize(root: Path) -> tuple[int, float, dict[str, tuple[int, int]]]:
    """Devolve o total, o percentual e a contagem (com docstring, total) por pasta."""
    folders: dict[str, list[int]] = {}
    have = 0
    total = 0
    for path in python_files(root):
        folder = str(path.parent.relative_to(root))
        bucket = folders.setdefault(folder, [0, 0])
        for node in definitions(path):
            total += 1
            bucket[1] += 1
            if ast.get_docstring(node):
                have += 1
                bucket[0] += 1
    percent = 100 * have / total if total else 100.0
    return have, percent, {name: (pair[0], pair[1]) for name, pair in folders.items()}


def main() -> None:
    """Imprime o total de app/ e o percentual de cada pasta."""
    root = Path(__file__).resolve().parents[1]
    have, percent, folders = summarize(root)
    total = sum(pair[1] for pair in folders.values())
    print(f"app {have}/{total} {percent:.1f}%")
    for name, (found, count) in sorted(folders.items()):
        share = 100 * found / count if count else 100.0
        print(f"{name} {found}/{count} {share:.1f}%")


if __name__ == "__main__":
    main()
