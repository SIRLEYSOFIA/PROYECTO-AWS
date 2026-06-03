# Proyecto AWS Sofia

Sistema POS para Sofia con frontend React publicado en GitHub Pages y backend serverless en AWS con API Gateway, Lambda y DynamoDB.

## Sitio publicado

```text
https://sirleysofia.github.io/PROYECTO-AWS/
```

## Credenciales de prueba

```text
Usuario: SofiaInPensante
Clave: SOF2026
```

## Estructura del proyecto

```text
.
├── .github/workflows/pages.yml
├── AWS SOFIA
│   ├── pos-frontend
│   └── aws-apigateway-ready
└── README.md
```

## Frontend

La aplicacion principal esta en:

```text
AWS SOFIA/pos-frontend
```

Ejecutar localmente:

```bash
cd "AWS SOFIA/pos-frontend"
npm install
npm run dev
```

Compilar igual que GitHub Pages:

```bash
cd "AWS SOFIA/pos-frontend"
npm install
npm run build:pages
```

El frontend incluye:

- POS de ventas.
- Inventario de productos.
- Historial de ventas.
- Cuadre de caja.
- Usuarios y roles demo.
- Conexion con API Gateway para productos.

## Backend AWS

La infraestructura serverless esta en:

```text
AWS SOFIA/aws-apigateway-ready
```

Backend principal:

```text
AWS SOFIA/aws-apigateway-ready/01-http-api-pos
```

Incluye:

- API Gateway HTTP.
- Lambda Python.
- DynamoDB para productos.
- DynamoDB para ventas.

Endpoints principales:

```text
GET  /api/products
GET  /api/products/search?name=arroz
GET  /api/products/search?barcode=1
POST /api/products
GET  /api/sales
POST /api/sales
```

API desplegada:

```text
https://387ozq7na6.execute-api.us-east-1.amazonaws.com
```

## GitHub Pages

El despliegue se ejecuta automaticamente con GitHub Actions cuando se sube codigo a `main`.

Workflow:

```text
.github/workflows/pages.yml
```

Configuracion importante:

- `AWS SOFIA/pos-frontend/vite.config.ts` usa `base: '/PROYECTO-AWS/'`.
- GitHub Pages publica `AWS SOFIA/pos-frontend/dist`.
- El workflow define `VITE_API_BASE_URL` con la URL de API Gateway.

## Seguridad

El repositorio no debe incluir credenciales AWS, archivos `.env`, `node_modules`, `dist`, `.aws-sam`, zips ni artefactos locales.
