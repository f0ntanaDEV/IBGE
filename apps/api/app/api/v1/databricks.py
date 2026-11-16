from fastapi import APIRouter

from app.integrations.databricks import embed_config

router = APIRouter(tags=["databricks"])


@router.get("/databricks/embed")
def databricks_embed(external_viewer_id: str = "") -> dict:
    return embed_config(external_viewer_id)
