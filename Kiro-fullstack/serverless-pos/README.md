# Serverless POS

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

El script carga los productos activos de `frontend/data/productos.json`.

## Pantallas conectadas a AWS

Con `configure-frontend.sh serverless`, estas pantallas usan API Gateway + Lambda + DynamoDB:

```text
productos.html
pos.html
ventas.html
```

## Conectar el frontend

Desde la carpeta `Kiro-fullstack`, usa:

```bash
./configure-frontend.sh serverless https://TU_API.execute-api.REGION.amazonaws.com
```
