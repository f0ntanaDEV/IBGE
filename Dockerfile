# API com as bases tratadas. O compose local continua em apps/api/Dockerfile.
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/pyproject.toml ./
COPY apps/api/app ./app
COPY apps/api/datasets.yaml apps/api/alembic.ini apps/api/ibge_reference.json ./
COPY apps/api/alembic ./alembic
COPY data/raw /data/raw

RUN pip install --no-cache-dir .

ENV DATA_DIR=/data \
    MYSQL_REQUIRED=false
RUN python -m app.tools.load_originals

COPY apps/api/news_snapshot /data/cache

ENV MYSQL_REQUIRED=true \
    LOAD_MYSQL_ON_START=true

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
