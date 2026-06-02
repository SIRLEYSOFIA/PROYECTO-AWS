# Proyecto Dianys - Frontend POS

Frontend web de punto de venta construido con HTML5 semantico, CSS propio y JavaScript vanilla modular. Consume una API Gateway para consultar productos y registrar ventas.

## Arquitectura

- Cliente: paginas HTML servidas por Spring Boot y modulos JavaScript en `src/main/resources/static`.
- API: configurada desde `src/main/resources/static/config.js`.
- Backend AWS esperado: API Gateway + `ProductsFunction` + `SalesFunction` + DynamoDB `ProductsTable` y `SalesTable`.
- Tabla extra: `UsersTable` para usuarios/roles, agregada por requerimiento del sistema.

Se usa JavaScript vanilla porque permite evidenciar directamente eventos del DOM, `fetch`, `async/await`, `try/catch`, grid/flexbox y estilos propios sin ocultarlos tras un framework.

## Ejecutar Local

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

La URL base se cambia en:

```text
src/main/resources/static/config.js
```

Rutas exigidas por el examen:

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

Los specs estan en:

```text
.kiro/specs/pos-frontend/requirements.md
.kiro/specs/pos-frontend/design.md
.kiro/specs/pos-frontend/tasks.md
```

## Capturas Para Entrega

- Productos cargados desde API en `productos.html`.
- Venta exitosa en `pos.html`.
- Comprobante o historial con respuesta del API.
- Error controlado cuando la API falle o el codigo no exista.
