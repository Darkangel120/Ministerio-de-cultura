# Ministerio del Poder Popular para la Cultura

Sistema de gestión cultural (Misión Cultura) reconstruido sobre
**Express + React SPA + PostgreSQL**, con identidad visual del Gobierno
Bolivariano de Venezuela (bandera tricolor y 8 estrellas).

> La versión PHP/Firebird original se conserva íntegra en `funcional/`
> como referencia histórica y no debe eliminarse.

## Stack

- `server/` — API REST Express + `pg` (sin ORM), JWT en cookie httpOnly
  (SameSite=Strict), uploads con multer a `server/uploads/`.
- `client/` — SPA React + Vite + React Router, CSS institucional propio,
  PDF de reportes con jsPDF.
- `db/` — PostgreSQL 16 vía `docker-compose.yml` (db/user/pass: `mincultura`).

## Requisitos

- Node.js 20+
- Docker (para PostgreSQL)

## Puesta en marcha

```bash
npm run setup           # instala workspaces (server + client)
docker compose up -d db # base de datos PostgreSQL 16
npm run db:init         # crea esquema + datos de ejemplo (idempotente)
npm run dev:server      # API en http://localhost:4000
npm run dev:client      # app en http://localhost:5173
```

## Credenciales de ejemplo (seed)

- Administrador: `admin@mincultura.gob.ve` / `Admin.2026!`
- Cultor de ejemplo: María González (cuenta creada vía registro).

## Módulos

Rutas: `/` Inicio · `/mision-vision` · `/marco-legal` · `/transparencia` ·
`/contacto` · `/login` · `/registro` · `/foro` · `/perfil/:id` ·
`/panel` (staff) · `/calendario` (staff) · `/cultores` (staff) ·
`/reportes` (staff) · `/crear-usuario` (admin/directores).

## Verificación rápida

Con el server corriendo: `bash scripts/smoke-test.sh` imprime `SMOKE TEST OK`.