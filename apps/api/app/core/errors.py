"""Erro padrão da API: {"error": {"code", "message", "details"}}."""


class AppError(Exception):
    """Falha de negócio com código HTTP e corpo padrão."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict | list | None = None,
    ) -> None:
        """Entra: code, message, status_code, details. Sai com o resultado de init  ."""
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details if details is not None else {}


def error_body(code: str, message: str, details: dict | list | None = None) -> dict:
    """Entra: code, message, details. Sai com o resultado de error body."""
    return {"error": {"code": code, "message": message, "details": details or {}}}
