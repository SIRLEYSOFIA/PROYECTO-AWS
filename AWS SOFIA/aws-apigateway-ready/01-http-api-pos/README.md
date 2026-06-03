# Serverless POS Sofia

Arquitectura simple del tablero:

```text
POS / Frontend
  -> API Gateway
    -> Lambda
      -> DynamoDB products
      -> DynamoDB sales
```

## Endpoints

```text
GET  /api/products
GET  /api/products/search?name=arroz
GET  /api/products/search?barcode=1
POST /api/products
POST /api/sales
GET  /api/sales?limit=50
```

## Validar y desplegar

```bash
sam validate --lint
sam build
sam deploy --guided
```

Cuando termine el deploy, SAM mostrará `ApiBaseUrl`.

## Cargar productos de ejemplo

Después del deploy, toma el output `ProductsTableName` y ejecuta:

```bash
python3 scripts/seed_products.py --table NOMBRE_DE_LA_TABLA
```

El script carga los productos definidos en `seed-products.json`.

## Conectar el frontend

El frontend React usa la URL de API Gateway mediante la variable:

```text
VITE_API_BASE_URL
```

En GitHub Pages esta variable se define en `.github/workflows/pages.yml`.
