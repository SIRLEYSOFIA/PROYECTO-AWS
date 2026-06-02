# Proyecto AWS Sofia

Proyecto POS con frontend React/Vite y backend serverless en AWS.

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

El proyecto esta preparado para GitHub Pages en:

```text
https://sirleysofia.github.io/PROYECTO-AWS/
```

El workflow esta en:

```text
.github/workflows/pages.yml
```

Usa `npm run build:pages` para compilar `pos-frontend` con Vite y publicar `pos-frontend/dist`.

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
