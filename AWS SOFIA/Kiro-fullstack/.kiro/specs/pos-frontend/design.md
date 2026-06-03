# Design

## Arquitectura

El sistema separa frontend, backend local y backend serverless:

- Frontend: HTML5, CSS y JavaScript vanilla.
- Backend local: Spring Boot para servir archivos y probar el flujo.
- Backend AWS: API Gateway, Lambda y DynamoDB con SAM.

## Justificacion del framework

Se usa JavaScript vanilla porque permite demostrar directamente los fundamentos pedidos por el examen: DOM, eventos, asincronismo, `fetch`, manejo de errores y CSS propio sin depender de abstracciones de framework.

## Componentes

- `login.html`: autenticacion.
- `productos.html`: listado de productos.
- `pos.html`: venta actual.
- `ventas.html`: historial.
- `modules/api.js`: cliente HTTP.
- `modules/cart.js`: estado de carrito.
- `modules/search.js`: busqueda.
- `modules/scanner.js`: codigo/ID.
- `modules/payment.js`: pago y registro.
- `modules/receipt.js`: comprobante.

## Contrato de API

- `GET /productos` y `GET /api/products`: productos.
- `GET /api/products/search?barcode={codigo}`: busqueda por codigo.
- `POST /ventas` y `POST /api/sales`: registro de venta.
- `GET /ventas` y `GET /api/sales`: ventas registradas.

La URL base se define en `config.js`.

## Persistencia

- `ProductsTable`: catalogo.
- `SalesTable`: ventas.
- `UsersTable`: usuarios y roles.
