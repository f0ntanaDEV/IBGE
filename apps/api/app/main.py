"""Aplicação FastAPI."""

import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import context, datasets, facts, health, milestones, news, territories
from app.core.errors import AppError, error_body
from app.core.logging import setup_logging


def _load_mysql() -> None:
    try:
        from app.tools.load_mysql_from_parquet import main

        main()
    except Exception:
        logging.getLogger(__name__).exception("carga MySQL falhou")


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    from app.core.config import get_settings

    if get_settings().load_mysql_on_start:
        threading.Thread(target=_load_mysql, name="mysql-load", daemon=True).start()
    from app.core.startup import start_seed

    start_seed()
    yield


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(title="Projeções da População IBGE", version="1.0.0", lifespan=_lifespan)
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(territories.router, prefix="/api/v1")
    app.include_router(datasets.router, prefix="/api/v1")
    app.include_router(milestones.router, prefix="/api/v1")
    app.include_router(news.router, prefix="/api/v1")
    app.include_router(facts.router, prefix="/api/v1")
    app.include_router(context.router, prefix="/api/v1")

    @app.exception_handler(AppError)
    def _app_error(_request, exc: AppError) -> JSONResponse:
        return JSONResponse(error_body(exc.code, exc.message, exc.details), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    def _validation(_request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            error_body("validation_error", "Parâmetros inválidos", {"errors": exc.errors()}),
            status_code=422,
        )

    @app.exception_handler(StarletteHTTPException)
    def _http(_request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(error_body("http_error", str(exc.detail)), status_code=exc.status_code)

    return app


app = create_app()
