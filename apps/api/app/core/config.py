"""Configuração da API e dos caminhos de dados."""

import logging
import os
import shutil
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(__file__).resolve().parents[2]
# No container a API fica em /app; localmente, dois níveis acima de apps/api.
REPO_ROOT = API_ROOT.parents[1] if len(API_ROOT.parents) > 1 else API_ROOT


class Settings(BaseSettings):
    """Variáveis de ambiente. Veja `.env.example` na raiz do repositório."""

    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "ibge"
    mysql_password: str = "ibge"
    mysql_database: str = "ibge"
    mysql_required: bool = False
    load_mysql_on_start: bool = False
    auto_seed: bool = True
    databricks_embed_mode: str = "preview"
    databricks_host: str = ""
    databricks_token: str = ""
    databricks_dashboard_id: str = ""
    databricks_warehouse_id: str = ""
    databricks_client_id: str = ""
    databricks_client_secret: str = ""
    service_principal_secret: str = ""
    data_dir: Path = Path("data")
    datasets_path: Path = API_ROOT / "datasets.yaml"
    max_upload_mb: int = 50
    ibge_timeout_s: float = 8.0
    ibge_retries: int = 2
    cache_ttl_s: int = 6 * 3600
    ibge_latest_revision: str = ""
    page_size_max: int = 200

    @property
    def database_url(self) -> str:
        """Entra: nenhum argumento. Sai com o resultado de database url."""
        user = quote_plus(self.mysql_user)
        password = quote_plus(self.mysql_password)
        return (
            f"mysql+pymysql://{user}:{password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def raw_dir(self) -> Path:
        """Entra: nenhum argumento. Sai com o resultado de raw dir."""
        return self.data_dir / "raw"

    @property
    def silver_dir(self) -> Path:
        """Parquet do ETL. SILVER_DIR só vale para a pasta data do repositório (amostra nos testes)."""
        override = os.environ.get("SILVER_DIR", "").strip()
        repo_data = (REPO_ROOT / "data").resolve()
        if override and self.data_dir.resolve() == repo_data:
            return Path(override)
        return self.data_dir / "silver"

    @property
    def processed_dir(self) -> Path:
        """Nome antigo da silver. O caminho real é data/silver."""
        return self.silver_dir


@lru_cache
def get_settings() -> Settings:
    """Entra: nenhum argumento. Sai com o resultado de get settings."""
    settings = Settings()
    configured = settings.data_dir
    if not configured.is_absolute():
        configured = (REPO_ROOT / configured).resolve()
    repo_data = (REPO_ROOT / "data").resolve()
    # `.env` usa `/data` para o compose. No Windows isso vira `C:\data` e o filtro do Brasil fica sem base.
    # `.env` usa `/data` para o compose. No Windows isso vira `C:\data`, que não existe.
    if not configured.exists() and ((repo_data / "silver").exists() or (repo_data / "processed").exists()):
        configured = repo_data
    object.__setattr__(settings, "data_dir", configured)
    if not os.environ.get("SILVER_DIR", "").strip():
        _migrate_processed(configured)
    return settings


def _migrate_processed(data_dir: Path) -> None:
    """Move data/processed para data/silver uma vez, se a silver ainda não tiver Parquet."""
    old = data_dir / "processed"
    new = data_dir / "silver"
    if not old.exists():
        return
    logger = logging.getLogger("app.core.config")
    if not new.exists():
        logger.warning("data/processed movida para data/silver")
        shutil.move(str(old), str(new))
        return
    if any(new.glob("ds1_*.parquet")):
        return
    if not any(old.glob("*.parquet")):
        return
    logger.warning("conteúdo de data/processed movido para data/silver")
    new.mkdir(parents=True, exist_ok=True)
    for item in old.iterdir():
        dest = new / item.name
        if dest.exists():
            continue
        shutil.move(str(item), str(dest))
