seed:
	docker compose exec api python -m app.tools.seed

export-databricks:
	cd apps/api && python -m app.tools.export_gold
