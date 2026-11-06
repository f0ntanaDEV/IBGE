"""Consulta os metadados do IBGE e grava apps/api/ibge_reference.json."""

import httpx

from app.integrations.ibge_agregados import discover_censo, save_reference


def main() -> None:
    with httpx.Client(timeout=30) as client:
        reference = discover_censo(client)
    save_reference(reference)
    print(reference)


if __name__ == "__main__":
    main()
