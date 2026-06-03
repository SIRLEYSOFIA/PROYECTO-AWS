# Requirements

## Objetivo

Construir un frontend POS web para Dianys que consulte productos y registre ventas mediante API Gateway, demostrando HTML5 semantico, CSS propio y JavaScript vanilla.

## Requisitos Funcionales

1. El sistema debe permitir iniciar sesion antes de operar el POS.
2. La vista de productos debe consumir `GET /productos` o `GET /api/products` y mostrar nombre, precio, categoria y seleccion.
3. El POS debe permitir agregar articulos por ID/codigo de barras, busqueda por nombre y categoria.
4. El POS debe aceptar operaciones tipo `1x24`, `1*24` o `1 24`, donde `1` es el codigo y `24` la cantidad.
5. El carrito debe mostrar productos seleccionados, cantidades, precio unitario y total.
6. El usuario debe poder sumar, restar y eliminar articulos del carrito con botones o atajos de teclado.
7. El sistema debe registrar la venta con `POST /ventas` o `POST /api/sales`.
8. Al registrar venta, debe mostrar comprobante o historial con respuesta visible.
9. Si la API falla o retorna error, debe mostrarse un mensaje controlado sin romper la interfaz.
10. La URL base del API Gateway debe estar centralizada en `config.js`.
11. La version Dianys no debe mostrar controles de descuentos.

## Requisitos No Funcionales

1. Usar HTML5 semantico en las vistas principales.
2. Usar CSS propio con box model, flexbox o grid.
3. Usar JavaScript con eventos, modulos, `fetch`, `async/await` y `try/catch`.
4. No subir `.env`, credenciales CSV, `node_modules`, `.aws-sam`, `target` ni archivos de sistema.
