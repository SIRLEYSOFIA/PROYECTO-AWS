# Guia de Demo

## Antes de presentar

Desde `Kiro-fullstack`:

```bash
./configure-frontend.sh local
./check-ready.sh
./run-local.sh
```

Si los servidores ya estan abiertos, basta con recargar el navegador.

## Demo rapida

1. Abrir:

```text
http://localhost:3000/login.html
```

2. Entrar:

```text
admin / admin123
```

3. Mostrar productos:

```text
http://localhost:3000/productos.html
```

Crear un producto activo si quieres demostrar CRUD.

4. Ir al POS:

```text
http://localhost:3000/pos.html
```

5. Presionar `?` o boton `Atajos`.

6. Flujo sin mouse:

```text
F2
arroz
Enter
+
F8
10000
Enter
```

7. Mostrar recibo.

8. Abrir historial:

```text
http://localhost:3000/ventas.html
```

Verifica que aparezca la venta completada con cajera, articulos, subtotal y total.

## Demo AWS/serverless

La version lista esta en:

```text
serverless-pos/
```

Comandos:

```bash
cd serverless-pos
sam validate --lint
sam build
sam deploy --guided
```

Luego:

```bash
python3 scripts/seed_products.py --table NOMBRE_TABLA_PRODUCTS
cd ..
./configure-frontend.sh serverless https://TU_API.execute-api.REGION.amazonaws.com
```

Despues vuelve a compilar o reiniciar el frontend para que copie el nuevo `config.js`:

```bash
cd frontend
mvn spring-boot:run
```

Para volver a local:

```bash
./configure-frontend.sh local
```
