# API das Projeções da População (IBGE, revisão 2024)

Pipeline de limpeza e API FastAPI das cinco tabelas em `data/raw/`. O contrato está em `specs/01-backend/`.

## Subir com Docker

```bash
cp .env.example .env
docker compose up --build
```

A API fica em `http://localhost:8000` e a documentação em `http://localhost:8000/docs`. O MySQL 8 sobe com healthcheck; a API só inicia depois do banco e aplica o Alembic.

## Local, sem Docker

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\python -m pip install -e ".[dev]"
$env:PYTHONPATH = "."
$env:MYSQL_REQUIRED = "false"
python -m uvicorn app.main:app --reload
```

`MYSQL_REQUIRED=true` faz o processamento falhar se a carga no MySQL não concluir. Com `false`, a base tratada ainda é gravada em `data/processed/`.

## Pipeline

```bash
python -m app.tools.profile ..\..\data\raw\tab1_idade_simples.xlsx
python -m app.tools.make_dirty ds1 --seed 42
python -m app.tools.discover_censo
```

`POST /api/v1/datasets/{id}/process` com `{"source":"original"|"upload"|"sujo"}`. Estratégias `cap` e `remove` na base oficial exigem `"confirm": true`.

## Rotas

Prefixo `/api/v1`: `/health`, `/territories`, `/datasets`, `/datasets/{id}/metrics`, `/upload`, `/process`, `/quality-report`, `/runs`, `/data`, `/summary`, `/pyramid`, `/claims`, `/news`, `/download` e `/reference/censo-2022`.

Erros: `{"error": {"code", "message", "details"}}`.
