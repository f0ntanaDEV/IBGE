"""Contagem única das validações, usada pelos Fatos e pela página."""

ENGINEERED_COLUMNS = {"is_outlier", "outlier_motivo", "row_uid"}


def summarize_validations(validations: list) -> dict:
    statuses = [_status(item) for item in validations]
    approved = sum(1 for status in statuses if status in {"ok", "ok_arredondamento"})
    rounded = sum(1 for status in statuses if status == "ok_arredondamento")
    total = len(validations)
    failed = [item for item, status in zip(validations, statuses, strict=True) if status == "falha"]
    return {
        "approved": approved,
        "rounded": rounded,
        "total": total,
        "text": f"{approved} de {total} aprovadas",
        "failed": failed,
    }


def _status(item) -> str:
    found = item.get("status") if isinstance(item, dict) else getattr(item, "status", None)
    if found in {"ok", "ok_arredondamento", "falha"}:
        return found
    ok = bool(item.get("ok")) if isinstance(item, dict) else bool(item.ok)
    return "ok" if ok else "falha"
