# Design

## Eleccion Tecnica

Se usa JavaScript vanilla porque permite demostrar directamente los fundamentos exigidos: HTML semantico, eventos del DOM, consumo API con `fetch`, asincronismo con `async/await`, errores con `try/catch` y estilos propios con grid/flexbox.

## Estructura

- `login.html`: autenticacion y control de sesion.
- `productos.html`: listado y administracion de productos.
- `pos.html`: venta actual, busqueda, codigo de barras, carrito y totales.
- `ventas.html`: historial de ventas.
- `modules/api.js`: cliente HTTP centralizado.
- `config.js`: URL base del API Gateway.

## Contrato API

```text
GET  /productos
GET  /api/products
GET  /api/products/search?barcode={codigo}
POST /ventas
POST /api/sales
GET  /ventas
GET  /api/sales
```

## Venta

La venta se envia con estructura clara para DynamoDB:

```json
{
  "products": [
    {
      "productId": 1,
      "productName": "Aceite Vegetal",
      "productPrice": 14500,
      "productCost": 0,
      "quantity": 1
    }
  ],
  "iva": 0,
  "subtotal": 14500,
  "total": 14500,
  "discount": 0
}
```

## Interfaz

Dianys usa una paleta clara verde/menta y navegacion lateral baja para diferenciarse del proyecto Pablito. No incluye controles visuales de descuento.
