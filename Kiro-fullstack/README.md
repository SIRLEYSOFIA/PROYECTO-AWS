# Proyecto Dianys - Fullstack POS

Proyecto POS con frontend HTML5/CSS/JavaScript, backend local Spring Boot y backend serverless AWS SAM.

## Arquitectura

- `frontend/`: paginas HTML semanticas, CSS propio y JavaScript vanilla modular.
- `backend/`: API local de desarrollo en Spring Boot.
- `serverless-pos/`: API Gateway + 2 Lambdas (`ProductsFunction`, `SalesFunction`) + DynamoDB `ProductsTable` y `SalesTable`.
- `UsersTable`: tabla adicional para usuarios/roles administrativos.

Se eligio JavaScript vanilla porque permite demostrar fundamentos de eventos, DOM, `fetch`, `async/await`, `try/catch`, box model, flexbox y grid sin depender de un framework.

## Ejecutar Local

```bash
./run-local.sh
```

O por separado:

```bash
cd backend
mvn spring-boot:run
```

```bash
cd frontend
mvn spring-boot:run
```

El frontend independiente de Dianys se ejecuta en:

```bash
cd "/home/pablitoinpensante/Documentos/Aws Global/Proyecto AWs Dianys/Kiro-frontend"
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082
```

Abrir:

```text
http://localhost:8082/login.html
```

Credenciales:

```text
DianysInPensante / DNL2026
```

## API Gateway

La URL base se configura en:

```text
frontend/src/main/resources/static/config.js
```

Rutas del examen:

```text
GET  /productos
POST /ventas
```

Rutas internas equivalentes:

```text
GET  /api/products
GET  /api/products/search?barcode=1
POST /api/sales
GET  /api/sales
```

## Proceso SDD

```text
.kiro/specs/pos-frontend/requirements.md
.kiro/specs/pos-frontend/design.md
.kiro/specs/pos-frontend/tasks.md
```

## Capturas Para Entrega

- `productos.html` con productos cargados desde API.
- `pos.html` registrando una venta exitosa.
- `ventas.html` o comprobante con respuesta del API.
- Error controlado cuando la API falle o el codigo no exista.

## Despliegue AWS

```bash
cd serverless-pos
sam build
sam deploy --guided
```

No subir `.env`, credenciales CSV, `node_modules`, `.aws-sam`, `target` ni archivos de sistema.
