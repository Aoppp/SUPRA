#!/bin/bash
set -e

echo "=== SAD — Supramolecular Assembly Database ==="
echo ""

# ── 1. System deps ──
echo "[1/5] Installing Docker & Git..."
apt-get update -qq
apt-get install -y -qq docker.io git curl > /dev/null
systemctl enable --now docker 2>/dev/null

# ── 2. Node.js 22 ──
echo "[2/5] Installing Node.js 22..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null
fi

# ── 3. Clone ──
echo "[3/5] Cloning project..."
rm -rf /opt/sad
git clone https://github.com/Aoppp/SUPRA.git /opt/sad
cd /opt/sad

# ── 4. Build frontend ──
echo "[4/5] Building frontend..."
cd /opt/sad/frontend
npm install --silent
npm run build
cd /opt/sad

# ── 5. Start services ──
echo "[5/5] Starting containers..."
docker compose up -d --build

# ── 6. Import data ──
echo ""
echo "Importing data..."
EXCEL_FILE="/opt/sad/data/260611_超分子数据库整理_修改(2).xlsx"
if [ -f "$EXCEL_FILE" ]; then
  docker compose cp "$EXCEL_FILE" backend:/app/data/
  docker compose exec backend python import_excel.py
else
  echo "Excel not found at $EXCEL_FILE — skipping import."
  echo "Upload the Excel file and run: docker compose exec backend python import_excel.py"
fi

echo ""
echo "=== Done! ==="
IP=$(curl -s ifconfig.me)
echo "Visit: http://$IP"
