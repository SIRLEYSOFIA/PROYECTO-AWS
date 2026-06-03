# Presentacion del Proyecto

## Nombre

Kiro POS Serverless

## Idea central

Sistema de punto de venta para supermercado con:

- Gestion de productos.
- Venta desde POS optimizado para cajera.
- Atajos de teclado para reducir uso del mouse.
- Backend local para demo rapida.
- Backend serverless listo con API Gateway, Lambda y DynamoDB.

## Arquitectura local de demo

```text
Frontend Spring Boot :3000
  -> Backend Spring Boot :8080
    -> productos.json local
    -> H2 en memoria para ventas
```

## Arquitectura objetivo AWS

```text
POS / Frontend
  -> API Gateway
    -> Lambda
      -> DynamoDB products
      -> DynamoDB sales
```

La carpeta `serverless-pos/` contiene la version serverless simple basada en el diagrama del tablero.

## Pantallas para mostrar

1. Login
   `http://localhost:3000/login.html`

2. Gestion de productos
   `http://localhost:3000/productos.html`

3. Punto de venta
   `http://localhost:3000/pos.html`

## Usuario demo

```text
SofiaInPensante / SOF2026
```

## Flujo recomendado

1. Entrar con `SofiaInPensante / SOF2026`.
2. Abrir gestion de productos.
3. Crear o revisar productos activos.
4. Ir al POS.
5. Presionar `?` para mostrar atajos.
6. Usar `F2`, buscar producto y `Enter`.
7. Usar `+` o `-` para ajustar cantidad.
8. Usar `F4` para descuento si aplica.
9. Usar `F8` para pago.
10. Confirmar pago y mostrar recibo.

## Puntos fuertes

- POS orientado a operacion real de caja.
- Atajos de teclado visibles y utilizables.
- Separacion clara entre productos, ventas y API.
- Serverless listo para evolucionar a AWS.
- Verificacion automatizada con `./check-ready.sh`.
