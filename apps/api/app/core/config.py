"""Configuração da API e dos caminhos de dados."""

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
    data_dir: Path = Path("data")
    datasets_path: Path = API_ROOT / "datasets.yaml"
    max_upload_mb: int = 50
    ibge_timeout_s: float = 8.0
    ibge_retries: int = 2
    cache_ttl_s: int = 6 * 3600
    page_size_max: int = 200

    @property
    def database_url(self) -> str:
        user = quote_plus(self.mysql_user)
        password = quote_plus(self.mysql_password)
        return (
            f"mysql+pymysql://{user}:{password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def processed_dir(self) -> Path:
        return self.data_dir / "processed"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.data_dir.is_absolute():
        object.__setattr__(settings, "data_dir", (REPO_ROOT / settings.data_dir).resolve())
    return settings
