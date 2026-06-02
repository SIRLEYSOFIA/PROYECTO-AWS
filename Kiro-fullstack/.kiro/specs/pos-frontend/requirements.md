# Requirements

## Objetivo

Construir un frontend POS web para consultar productos y registrar ventas contra un API serverless en AWS usando HTML5, CSS y JavaScript vanilla.

## Requisitos funcionales

1. Mostrar login antes de entrar al sistema.
2. Consumir `GET /productos` o `GET /api/products` para listar productos.
3. Permitir busqueda por nombre, categoria y codigo/ID.
4. Permitir entrada rapida `ID*cantidad`.
5. Permitir agregar, quitar y cambiar cantidades del carrito.
6. Calcular subtotal y total.
7. Registrar ventas mediante `POST /ventas` o `POST /api/sales`.
8. Mostrar comprobante o mensaje de exito cuando el API registre la venta.
9. Mostrar errores claros cuando el API falle o la respuesta sea invalida.
10. Configurar la URL base del API Gateway en `config.js`.

## Requisitos no funcionales

1. Usar HTML semantico.
2. Usar CSS propio con flexbox/grid.
3. Usar JavaScript modular, eventos, `fetch`, `async/await` y `try/catch`.
4. Permitir operacion por teclado.
5. No subir secretos ni archivos generados innecesarios.
