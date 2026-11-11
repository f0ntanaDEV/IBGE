"""Contagem única das validações, usada pelos Fatos e pela página."""

ENGINEERED_COLUMNS = {"is_outlier", "outlier_motivo", "row_uid"}


def summarize_validations(validations: list) -> dict:
    approved = sum(1 for item in validations if _ok(item))
    total = len(validations)
    failed = [item for item in validations if not _ok(item)]
    return {
        "approved": approved,
        "total": total,
        "text": f"{approved} de {total} aprovadas",
        "failed": failed,
    }


def _ok(item) -> bool:
    if isinstance(item, dict):
        return bool(item.get("ok"))
    return bool(item.ok)
