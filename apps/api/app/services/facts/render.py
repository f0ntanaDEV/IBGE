"""Texto dos fatos no formato valor · rótulo."""

from app.services.facts.models import Fact, FactPart


def render_fact(fact: Fact) -> str:
    """Entra: fact. Sai com o resultado de render fact."""
    if fact.parts:
        return _join([_part(part) for part in fact.parts])
    main = _plain(fact.value, fact.kind)
    extra = fact.detail or ""
    points = fact.detail_values or []
    chunks = [main]
    if points:
        for point in points:
            text = _plain(point.valor, point.kind)
            if point.rotulo and "{valor}" in point.rotulo:
                chunks.append(point.rotulo.replace("{valor}", text))
            elif point.rotulo:
                chunks.append(f"{point.rotulo}: {text}")
            else:
                chunks.append(f"{point.ano}: {text}")
    elif extra:
        chunks.append(extra)
    return _join(chunks)


def _part(part: FactPart) -> str:
    """Entra: part. Sai com o resultado de part."""
    text = part.value if isinstance(part.value, str) else _plain(part.value, part.kind)
    if part.label and "{v}" in part.label:
        return part.label.replace("{v}", str(text))
    if not part.label:
        return str(text)
    if part.position == "suffix":
        return f"{text} {part.label}"
    return f"{part.label} {text}"


def _join(chunks: list[str]) -> str:
    """Entra: chunks. Sai com o resultado de join."""
    out = ""
    for chunk in chunks:
        if not chunk:
            continue
        if not out:
            out = chunk
        elif out.endswith("→") or chunk.startswith("→"):
            out = f"{out} {chunk}"
        else:
            out = f"{out} · {chunk}"
    return out


def _plain(value: float | int | str, kind: str) -> str:
    """Entra: value, kind. Sai com o resultado de plain."""
    if isinstance(value, str):
        return value
    if kind == "count":
        return f"{int(round(float(value))):,}".replace(",", ".")
    if kind == "percent":
        return f"{float(value) * 100:.1f}%".replace(".", ",")
    if kind == "permil":
        return f"{float(value):.2f} por mil".replace(".", ",")
    if kind == "year":
        return str(int(value))
    if kind in {"years", "rate", "index"}:
        number = float(value)
        digits = 1 if abs(number - round(number, 1)) < 1e-9 else 2
        return f"{number:.{digits}f}".replace(".", ",")
    if isinstance(value, float):
        return f"{value:.2f}".replace(".", ",")
    return str(value)
