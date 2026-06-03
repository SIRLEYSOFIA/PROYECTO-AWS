# Proyecto AWS Sofia

Proyecto POS con frontend React/Vite y backend serverless en AWS.

## Sitio publicado

El frontend principal esta publicado en GitHub Pages:

```text
https://sirleysofia.github.io/PROYECTO-AWS/
```

La publicacion se hace automaticamente con GitHub Actions cuando se sube codigo a `main`.

## Frontend principal

El frontend principal esta en:

```bash
pos-frontend
```

Para ejecutarlo localmente:

```bash
cd pos-frontend
npm install
npm run dev
```

El frontend usa la API desplegada en AWS:

```text
https://387ozq7na6.execute-api.us-east-1.amazonaws.com
```

## GitHub Pages

El workflow de despliegue esta en:

```text
.github/workflows/pages.yml
```

Para compilar el frontend igual que GitHub Pages:

```bash
cd pos-frontend
npm install
npm run build:pages
```

Configuracion importante:

- `pos-frontend/vite.config.ts` usa `base: '/PROYECTO-AWS/'`.
- El workflow publica `pos-frontend/dist`.
- El workflow inyecta `VITE_API_BASE_URL` con la URL del API Gateway.

## Backend AWS

La infraestructura serverless principal esta en:

```bash
Kiro-fullstack/serverless-pos
```

Incluye:

- API Gateway HTTP.
- Lambda para productos.
- Lambda para ventas.
- DynamoDB para productos, ventas y usuarios.

Stack desplegado:

```text
sofia-pos-serverless
```

Region:

```text
us-east-1
```

## Seguridad

No se suben credenciales AWS, archivos `.env`, `node_modules`, `dist`, `.aws-sam`, zips ni artefactos locales.
