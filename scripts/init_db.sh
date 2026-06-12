#!/bin/bash
# Run on server: bash scripts/init_db.sh
set -e

echo "=== Running Excel data import ==="
docker compose run --rm backend python import_excel.py

echo "=== Done: $(docker compose run --rm backend python -c 'from database import SessionLocal; from models import Assembly; db=SessionLocal(); print(db.query(Assembly).count()); db.close()') assemblies imported ==="
