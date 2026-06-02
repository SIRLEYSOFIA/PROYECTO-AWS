#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Checking frontend JavaScript..."
(
  cd "$ROOT_DIR/frontend"
  node --check src/main/resources/static/pos.js
  node --check src/main/resources/static/modules/search.js
  node --check src/main/resources/static/modules/cart.js
  node --check src/main/resources/static/modules/cartPanel.js
  node --check src/main/resources/static/modules/payment.js
  node --check src/main/resources/static/ventas.js
)

echo "Building frontend..."
(
  cd "$ROOT_DIR/frontend"
  mvn -q -DskipTests package
)

echo "Building local backend..."
(
  cd "$ROOT_DIR/backend"
  mvn -q -DskipTests package
)

echo "Validating serverless SAM template..."
(
  cd "$ROOT_DIR/serverless-pos"
  python3 -m py_compile src/app.py scripts/seed_products.py
  sam validate --lint
  sam build
)

echo "Ready."
