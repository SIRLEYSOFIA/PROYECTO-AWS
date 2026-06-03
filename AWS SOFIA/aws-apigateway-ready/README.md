# AWS API Gateway Ready

Esta carpeta separa el proyecto en dos opciones de despliegue para AWS API Gateway.

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

## 02-rest-api-microservices

API REST mas completa con SAM:

- API Gateway `AWS::Serverless::Api`
- Lambda Java Spring para ventas
- Lambda Java Spring para productos
- DynamoDB para productos
- Parametros para conectar base de datos de ventas y APIs externas

Comandos:

```bash
cd 02-rest-api-microservices
sam validate --lint
sam build
sam deploy --guided
```

Esta opcion pide parametros como `DatabaseUrl`, `DatabaseUsername`, `DatabasePassword`, `ProductApiBaseUrl` y `CustomerApiBaseUrl`.

## Recomendacion

Para presentar rapido y con menos configuracion, usa `01-http-api-pos`.
Para defender arquitectura de microservicios REST mas completa, usa `02-rest-api-microservices`.
