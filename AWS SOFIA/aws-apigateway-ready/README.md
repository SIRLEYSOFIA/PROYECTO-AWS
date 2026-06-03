# AWS API Gateway Ready

Backend serverless del proyecto POS Sofia.

## 01-http-api-pos

API HTTP simple con SAM:

- API Gateway `AWS::Serverless::HttpApi`
- Lambda Python
- DynamoDB `ProductsTable`
- DynamoDB `SalesTable`
- Endpoints listos:
  - `GET /api/products`
  - `POST /api/products`
  - `GET /api/products/search`
  - `POST /api/sales`
  - `GET /api/sales`

Comandos:

```bash
cd 01-http-api-pos
sam validate --lint
sam build
sam deploy --guided
```

Despues del deploy, carga productos:

```bash
python3 scripts/seed_products.py --table NOMBRE_TABLA_PRODUCTS
```
