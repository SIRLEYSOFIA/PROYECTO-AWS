# Proyecto AWS Sofia - POS Serverless

Sistema POS web para Sofia con frontend, API Gateway, Lambdas y DynamoDB.

## Rutas

Frontend local:

```bash
Kiro-frontend
```

Backend serverless:

```bash
Kiro-fullstack/serverless-pos
```

## Arquitectura

- Cliente web: HTML5 semantico, CSS propio y JavaScript vanilla modular.
- Backend local: Spring Boot para servir el frontend.
- Backend AWS: API Gateway + 2 Lambdas (`ProductsFunction`, `SalesFunction`) + DynamoDB con AWS SAM.
- Tablas DynamoDB: `ProductsTable`, `SalesTable` y `UsersTable`.

Se eligio JavaScript vanilla porque el proyecto necesita demostrar fundamentos: eventos, DOM, `fetch`, `async/await`, `try/catch`, CSS grid/flexbox y separacion frontend/backend.

## Ejecutar localmente

```bash
cd Kiro-frontend
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082
```

Abrir:

```text
http://localhost:8082/login.html
```

Credenciales:

```text
Usuario: SofiaInPensante
Clave:   SOF2026
```

Estas credenciales corresponden a la usuaria principal del proyecto.

## Configurar API Gateway

El frontend lee la URL desde:

```text
Kiro-frontend/src/main/resources/static/config.js
```

La API actual del proyecto Sofia esta configurada como:

```text
https://387ozq7na6.execute-api.us-east-1.amazonaws.com
```

## Endpoints

El backend soporta las rutas del examen y las rutas internas del frontend:

```text
GET  /productos
POST /ventas
GET  /api/products
GET  /api/products/search?barcode=1
POST /api/sales
GET  /api/sales
```

## Proceso SDD

Specs del frontend:

```text
Kiro-frontend/.kiro/specs/pos-frontend/requirements.md
Kiro-frontend/.kiro/specs/pos-frontend/design.md
Kiro-frontend/.kiro/specs/pos-frontend/tasks.md
```

Specs del backend/fullstack:

```text
Kiro-fullstack/.kiro/specs/pos-frontend/requirements.md
Kiro-fullstack/.kiro/specs/pos-frontend/design.md
Kiro-fullstack/.kiro/specs/pos-frontend/tasks.md
```

## Capturas requeridas para entrega

Tomar capturas de:

- `productos.html` con productos cargados desde API.
- `pos.html` registrando una venta.
- Comprobante o historial mostrando la venta exitosa.
- Un error controlado, por ejemplo API no disponible o codigo inexistente.

## Despliegue serverless

```bash
cd Kiro-fullstack/serverless-pos
sam build
sam deploy --guided
```

## GitHub

Antes de subir, no incluir secretos, `.env`, `node_modules`, archivos de sistema ni credenciales CSV.
