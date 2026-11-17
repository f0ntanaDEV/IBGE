from fastapi import APIRouter

from app.integrations.databricks import embed_config

router = APIRouter(tags=["databricks"])


@router.get("/databricks/embed")
def databricks_embed() -> dict:
    """GET /databricks/embed. Parâmetros: nenhum argumento."""
    return embed_config()
