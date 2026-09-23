# Rediseño Ministerio de Cultura — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir el sistema del Ministerio del Poder Popular para la Cultura en Express + React SPA + PostgreSQL, con identidad visual del Gobierno Bolivariano de Venezuela (bandera tricolor + 8 estrellas), conservando íntegramente todos los datos, formularios y funcionalidades actuales.

**Architecture:** Monorepo npm con workspaces. `server/` = API REST Express + `pg` (sin ORM), JWT en cookie httpOnly, uploads con multer. `client/` = React (Vite) + React Router, sin librerías de UI (CSS institucional propio), PDF con jsPDF (cliente). PostgreSQL 16 vía Docker.

**Tech Stack:** Node 20+, Express 4, pg 8, bcryptjs, jsonwebtoken, cookie-parser, multer, dotenv, React 18, react-router-dom 6, Vite 5, jspdf + jspdf-autotable, PostgreSQL 16.

## Global Constraints

- Conservar los campos y valores de los formularios actuales (ficha de cultor, evento Misión Cultura, registro, crear usuario) con los mismos nombres de columna de `funcional/db/database.sql`.
- Roles exactos: `admin`, `director_general`, `director_operativo`, `funcionario`, `cultor`, `publico`.
- Paleta: amarillo `#FFD700`, azul `#003893`, rojo `#CF142B`; pie de página con "Realizado por Rodolfo Gómez".
- Secret administrador (seed): `admin@mincultura.gob.ve` / `Admin.2026!`.
- Eliminaciones blandas (`activo=0`), nunca borrado físico (salvo likes con UNIQUE).
- Todo query SQL parametrizado (`$1`, `$2`, …), nunca interpolación.
- El `.FDB` no se migra; `seed.sql` recrea los datos de ejemplo equivalentes a `database.sql:150-186`.
- Archivos de `funcional/`, `assets/` y los `.html` de la raíz NO se borran (referencia histórica).
- Cualquier bug → detenerse, aplicar systematic-debugging, no parchear a ciegas.

## File Map

- `docker-compose.yml` — postgres:16.
- `package.json` — workspaces npm (`server`, `client`) + scripts.
- `server/package.json`, `server/.env.example`, `server/uploads/` (gitignore).
- `server/src/index.js` — bootstrap Express, estáticos `/uploads`, rutas.
- `server/src/db.js` — pool pg + helper `query`.
- `server/src/auth.js` — JWT firmar/verificar, middleware `autenticar`, `autorizarRoles`.
- `server/src/validadores.js` — listas de opciones + helpers de validación.
- `server/src/rutas/auth.js`, `dashboard.js`, `eventos.js`, `cultores.js`, `foro.js`, `noticias.js`, `usuarios.js`, `reportes.js`.
- `server/src/sql/schema.sql`, `server/src/sql/seed.sql`.
- `server/src/scripts/db-init.js` — DROP/CREATE + schema + seed + bcrypt del admin.
- `client/vite.config.js`, `client/index.html`, `client/public/favicon.jpg` (copiar de `assets/favicon.jpg`).
- `client/src/main.jsx`, `api.js`, `context/AuthContext.jsx`, `constantes.js`, `estilos/base.css`.
- `client/src/componentes/` — `Bandera.jsx`, `Header.jsx`, `Footer.jsx`, `RequeridoLayout.jsx`, `MediaArchivo.jsx` (Task 19).
- `client/src/paginas/` — `Inicio.jsx`, `MisionVision.jsx`, `MarcoLegal.jsx`, `Transparencia.jsx`, `Contacto.jsx`, `Login.jsx`, `Registro.jsx`, `Panel.jsx`, `Calendario.jsx`, `Cultores.jsx`, `Reportes.jsx`, `CrearUsuario.jsx`, `Foro.jsx`, `Perfil.jsx`.
- `README.md` — actualizar con instrucciones.

## Fuentes de verdad

- Esquema y datos: `funcional/db/database.sql` (réplica exacta).
- Formulario evento: `funcional/calendario.php:360-598`.
- Formulario cultor/registro: `funcional/registro.php:160-328`.
- Crear usuario: `funcional/crear_usuario.php:190-244`.
- Reportes x filtros: `funcional/reportes.php` (tipos y filtros).
- Perfil/listas de cultores: `funcional/perfil.php`, `funcional/cultores.php`.

---

### Task 1: Scaffold del monorepo (docker, workspaces, gitignore)

**Files:**
- Create: `package.json`
- Create: `docker-compose.yml`
- Create: `.gitignore`
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/uploads/.gitkeep`
- Create: `client/package.json`

**Interfaces:**
- Consumes: nada (raíz del repo existente).
- Produces: contenedor `mincultura-db` en puerto 5432, user/db/pass `mincultura`; workspaces `server` y `client`; scripts npm `setup`, `dev:server`, `dev:client`, `db:init`, `build`. Dependencias instaladas que Tasks 3-21 usarán.

- [ ] **Step 1: Crear root `package.json`**

```json
{
  "name": "ministerio-de-cultura",
  "private": true,
  "workspaces": ["server", "client"],
  "scripts": {
    "setup": "npm install",
    "dev:server": "npm --workspace server run dev",
    "dev:client": "npm --workspace client run dev",
    "db:init": "npm --workspace server run db:init",
    "build": "npm --workspace client run build"
  }
}
```

- [ ] **Step 2: Crear `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16
    container_name: mincultura-db
    environment:
      POSTGRES_DB: mincultura
      POSTGRES_USER: mincultura
      POSTGRES_PASSWORD: mincultura
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mincultura"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  pgdata:
```

- [ ] **Step 3: Crear `.gitignore`** (a nivel raíz; reemplaza el existente si hay)

```gitignore
node_modules/
server/uploads/*
!server/uploads/.gitkeep
.env
dist/
*.log
```

- [ ] **Step 4: Crear `server/package.json`**

```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "db:init": "node src/scripts/db-init.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.12.0"
  }
}
```

- [ ] **Step 5: Crear `server/.env.example`**

```
PORT=4000
DATABASE_URL=postgres://mincultura:mincultura@localhost:5432/mincultura
JWT_SECRET=cambiar-en-produccion
COOKIE_SECURE=false
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

- [ ] **Step 6: Crear `server/uploads/.gitkeep`** (archivo vacío; el directorio es ignorado salvo este archivo).

- [ ] **Step 7: Crear `client/package.json`**

```json
{
  "name": "client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 8: Instalar y verificar**

Run: `docker compose up -d db && sleep 4 && docker exec mincultura-db pg_isready -U mincultura`
Expected: `... accepting connections`

Run: `npm install && npm --workspace server ls --depth=0 && npm --workspace client ls --depth=0`
Expected: listado de dependencias de ambos workspaces sin errores.

- [ ] **Step 9: Commit**

```bash
git add package.json docker-compose.yml .gitignore server/package.json server/.env.example server/uploads/.gitkeep client/package.json
git commit -m "feat: scafful monorepo Express+React y PostgreSQL 16"
```

---

### Task 2: esquema y seed de PostgreSQL

**Files:**
- Create: `server/src/sql/schema.sql`
- Create: `server/src/sql/seed.sql`
- Create: `server/src/scripts/db-init.js`

**Interfaces:**
- Consumes: `DATABASE_URL` (Task 1). Peula `pg.Pool` (Task 1 dep).
- Produces: tablas `usuarios`, `cultores`, `eventos`, `foro_publicaciones`, `foro_comentarios`, `foro_likes`, `noticias` (réplica del Firebird); datos de ejemplo; script `npm --workspace server run db:init` idempotente que deja el password del admin hasheado.

- [ ] **Step 1: Escribir `server/src/sql/schema.sql` (réplica fiel de `database.sql`)**

```sql
-- Réplica PostgreSQL del esquema Firebird de funcional/db/database.sql

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin','director_general','director_operativo','funcionario','cultor','publico')),
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1))
);
CREATE INDEX idx_usuarios_email ON usuarios (email);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios (tipo_usuario);

CREATE TABLE cultores (
    id SERIAL PRIMARY KEY,
    nombres_apellidos VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    correo VARCHAR(255) NOT NULL UNIQUE,
    area_tematica VARCHAR(20) NOT NULL CHECK (area_tematica IN ('musica','danza','teatro','artesPlasticas','literatura','artesanias','cine','fotografia')),
    disciplina VARCHAR(100) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    parroquia VARCHAR(100) NOT NULL,
    carnet_patria VARCHAR(50) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    lugar_nacimiento VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad INTEGER NOT NULL,
    trayectoria_anios INTEGER NOT NULL,
    organizacion VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1))
);
CREATE INDEX idx_cultores_cedula ON cultores (cedula);
CREATE INDEX idx_cultores_correo ON cultores (correo);
CREATE INDEX idx_cultores_area_tematica ON cultores (area_tematica);
CREATE INDEX idx_cultores_municipio ON cultores (municipio);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    correo_usuario VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    parroquia VARCHAR(100) NOT NULL,
    organizacion VARCHAR(255) NOT NULL,
    tipo_organizacion VARCHAR(10) DEFAULT 'comuna' CHECK (tipo_organizacion IN ('comuna','circuito')),
    direccion VARCHAR(255) NOT NULL,
    ubicacion_exacta VARCHAR(255),
    consejo_comunal VARCHAR(255) NOT NULL,
    nombre_consejo VARCHAR(255),
    nombre_comuna VARCHAR(255) NOT NULL,
    vocero_nombre VARCHAR(255) NOT NULL,
    vocero_cedula VARCHAR(20) NOT NULL,
    vocero_telefono VARCHAR(20) NOT NULL,
    responsable_nombre VARCHAR(255) NOT NULL,
    responsable_cedula VARCHAR(20) NOT NULL,
    responsable_telefono VARCHAR(20) NOT NULL,
    responsable_cargo VARCHAR(20) NOT NULL CHECK (responsable_cargo IN ('Animador','Coordinador','Facilitador','Tutor')),
    tipo_actividad VARCHAR(100) NOT NULL,
    disciplina VARCHAR(50) NOT NULL,
    nombre_actividad VARCHAR(255) NOT NULL,
    objetivo VARCHAR(500) NOT NULL,
    mes INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    duracion INTEGER NOT NULL,
    ninos INTEGER DEFAULT 0,
    ninas INTEGER DEFAULT 0,
    jovenes_masculinos INTEGER DEFAULT 0,
    jovenes_femeninas INTEGER DEFAULT 0,
    adultos_masculinos INTEGER DEFAULT 0,
    adultos_femeninas INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_ejecucion VARCHAR(20) DEFAULT 'registrado' CHECK (estado_ejecucion IN ('registrado','ejecutado','reportada')),
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1))
);
CREATE INDEX idx_eventos_fecha ON eventos (fecha);
CREATE INDEX idx_eventos_mes ON eventos (mes);
CREATE INDEX idx_eventos_disciplina ON eventos (disciplina);
CREATE INDEX idx_eventos_estado ON eventos (estado);
CREATE INDEX idx_eventos_municipio ON eventos (municipio);

CREATE TABLE foro_publicaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('danza','musica','artesPlasticas','poesia','teatro','cine','fotografia','artesanias')),
    descripcion TEXT NOT NULL,
    archivo_url VARCHAR(500),
    tipo_archivo VARCHAR(10) CHECK (tipo_archivo IN ('imagen','video','audio')),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1)),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_foro_publicaciones_categoria ON foro_publicaciones (categoria);
CREATE INDEX idx_foro_publicaciones_fecha ON foro_publicaciones (fecha_publicacion);

CREATE TABLE foro_comentarios (
    id SERIAL PRIMARY KEY,
    publicacion_id INTEGER NOT NULL,
    usuario_id INTEGER,
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1)),
    FOREIGN KEY (publicacion_id) REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_foro_comentarios_publicacion ON foro_comentarios (publicacion_id);
CREATE INDEX idx_foro_comentarios_fecha ON foro_comentarios (fecha_comentario);

CREATE TABLE foro_likes (
    id SERIAL PRIMARY KEY,
    publicacion_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_like TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (publicacion_id, usuario_id),
    FOREIGN KEY (publicacion_id) REFERENCES foro_publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_foro_likes_publicacion ON foro_likes (publicacion_id);
CREATE INDEX idx_foro_likes_fecha ON foro_likes (fecha_like);

CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    autor_id INTEGER,
    activo SMALLINT DEFAULT 1 CHECK (activo IN (0,1)),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_noticias_fecha ON noticias (fecha_publicacion);
CREATE INDEX idx_noticias_activo ON noticias (activo);
```

- [ ] **Step 2: Escribir `server/src/sql/seed.sql` (datos equivalentes a `database.sql:150-186`)**

El password del admin es un placeholder; `db-init.js` lo reemplaza con bcrypt (Step 4). Las fechas se ubican en 2026 para que "próximos eventos" tenga datos.

```sql
-- Datos de ejemplo equivalentes a database.sql:150-186

INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password_hash) VALUES
('Administrador Sistema', 'admin@mincultura.gob.ve', '02121234567', 'admin', 'SERA_REEMPLAZADO_POR_HASH');

INSERT INTO cultores (nombres_apellidos, telefono, cedula, correo, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad, trayectoria_anios, organizacion) VALUES
('María González', '04141234567', 'V-12345678', 'maria.gonzalez@email.com', 'musica', 'Cuatro venezolano', 'Comuna 1', 'Libertador', 'Catedral', '123456789012', 'Av. Principal 123', 'Caracas', '1985-03-15', 41, 15, 'Fundación Música Venezolana');

INSERT INTO eventos (correo_usuario, estado, municipio, parroquia, organizacion, direccion, consejo_comunal, nombre_comuna, vocero_nombre, vocero_cedula, vocero_telefono, responsable_nombre, responsable_cedula, responsable_telefono, responsable_cargo, tipo_actividad, disciplina, nombre_actividad, objetivo, mes, fecha, hora, duracion, ninos, ninas, jovenes_masculinos, jovenes_femeninas, adultos_masculinos, adultos_femeninas, estado_ejecucion) VALUES
('admin@mincultura.gob.ve', 'Distrito Capital', 'Libertador', 'Catedral', 'Fundación Música Venezolana', 'Teatro Nacional', 'Consejo Comunal Catedral', 'Comuna Catedral', 'Juan Pérez', 'V-87654321', '04149876543', 'Ana López', 'V-11223344', '04145566778', 'Coordinador', 'Presentación artística', 'música', 'Concierto de Música Tradicional', 'POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR', 10, '2026-10-15', '19:00:00', 2, 10, 15, 8, 12, 25, 30, 'registrado');

INSERT INTO foro_publicaciones (usuario_id, titulo, categoria, descripcion, archivo_url, tipo_archivo) VALUES
(1, 'Compartiendo mi última composición', 'musica', 'He estado trabajando en una nueva pieza inspirada en la música tradicional venezolana. ¡Me gustaría compartirla con la comunidad!', NULL, NULL);

INSERT INTO noticias (titulo, contenido) VALUES
('Gran concierto nacional celebra la cultura venezolana', 'Eventos culturales se realizan en todo el país promoviendo la identidad nacional.'),
('Nueva exposición en la Galería de Arte Nacional', 'Artistas venezolanos presentan sus obras más recientes al público caraqueño.'),
('Feria del Libro 2026 anuncia invitados especiales', 'Escritores nacionales e internacionales participarán en el evento literario.');
```

- [ ] **Step 3: Escribir `server/src/scripts/db-init.js`**

```js
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(__dirname, '..', 'sql');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
  const schema = readFileSync(join(sqlDir, 'schema.sql'), 'utf8');
  const seed = readFileSync(join(sqlDir, 'seed.sql'), 'utf8');

  await pool.query('BEGIN');
  try {
    await pool.query(`DROP SCHEMA public CASCADE`);
    await pool.query(`CREATE SCHEMA public`);
    await pool.query(schema);
    await pool.query(seed);
    const hash = await bcrypt.hash('Admin.2026!', 10);
    await pool.query(`UPDATE usuarios SET password_hash = $1 WHERE email = 'admin@mincultura.gob.ve'`, [hash]);
    await pool.query('COMMIT');
    console.log(`Base de datos "${dbName}" inicializada (schema + seed).`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Fallo al inicializar:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
```

- [ ] **Step 4: Verificar ejecutando dos veces (idempotente)**

Run: `npm --workspace server run db:init && npm --workspace server run db:init`
Expected: ambas corridas imprimen `Base de datos "mincultura" inicializada (schema + seed).` sin errores.

Run: `docker exec mincultura-db psql -U mincultura -d mincultura -c "SELECT COUNT(*) FROM usuarios;" -c "SELECT COUNT(*) FROM eventos;" -c "SELECT email, tipo_usuario FROM cultores;" -c "SELECT password_hash FROM usuarios WHERE email='admin@mincultura.gob.ve';"`
Expected: 1 usuario, 1 evento, la fila de María González, y un hash que empiece con `$2`.

- [ ] **Step 5: Commit**

```bash
git add server/src/sql/schema.sql server/src/sql/seed.sql server/src/scripts/db-init.js
git commit -m "feat: esquema y seed PostgreSQL + script db:init idempotente"
```

---

### Task 3: Core del servidor (db.js, auth.js, validadores, index.js)

**Files:**
- Create: `server/src/db.js`
- Create: `server/src/auth.js`
- Create: `server/src/validadores.js`
- Create: `server/src/index.js`

**Interfaces:**
- Consumes: `DATABASE_URL`, `PORT`, `JWT_SECRET`, `COOKIE_SECURE`, `UPLOAD_DIR`, `MAX_FILE_SIZE` (env de Task 1); módulos `pg`, `express`, `cookie-parser`, `jsonwebtoken`, `bcryptjs`, `multer`, `dotenv`.
- Produces:
  - `db.js` → exporta `query(text, params)` (promesa) y `pool`.
  - `auth.js` → `firmarToken(usuario)`, `autenticar(req,res,next)`, `autorizarRoles(...roles)`.
  - `validadores.js` → exporta `AREAS_TEMATICAS`, `AREAS_VE`, `CATEGORIAS_FORO`, `CARGOS_RESPONSABLE`, `TIPOS_ORGANIZACION`, `TIPOS_ACTIVIDAD`, `DISCIPLINAS_EVENTO`, `OBJETIVOS_TRANSFORMADORES`, `MESES`, `PARTICIPAR_KEYS`, `esEmail()` y `numeroEntero()`.
  - `index.js` → monta `/api/auth`, `/api/dashboard`, `/api/eventos`, `/api/cultores`, `/api/foro`, `/api/noticias`, `/api/usuarios`, `/api/reportes`, `/uploads` estático, cookie-parser, JSON.

- [ ] **Step 1: Escribir `server/src/db.js`**

```js
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
export default pool;
```

- [ ] **Step 2: Escribir `server/src/auth.js`**

```js
import jwt from 'jsonwebtoken';

export const COOKIE_NOMBRE = 'mc_token';

export const firmarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo_usuario, nombre: usuario.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

export const autenticar = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NOMBRE];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

export const autorizarRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
};
```

- [ ] **Step 3: Escribir `server/src/validadores.js`**

```js
export const AREAS_TEMATICAS = [
  'musica', 'danza', 'teatro', 'artesPlasticas', 'literatura', 'artesanias', 'cine', 'fotografia',
];
export const AREAS_VE = [
  'Distrito Capital', 'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Falcón', 'Guárico', 'Lara', 'Mérida',
  'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
  'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
];
export const CATEGORIAS_FORO = [
  'danza', 'musica', 'artesPlasticas', 'poesia', 'teatro', 'cine', 'fotografia', 'artesanias',
];
export const CARGOS_RESPONSABLE = ['Animador', 'Coordinador', 'Facilitador', 'Tutor'];
export const TIPOS_ORGANIZACION = ['comuna', 'circuito'];
export const TIPOS_ACTIVIDAD = [
  'Cumpleaños viva Venezuela',
  'despligues homenajes/ amor en acción/ jornada',
  'Presentación artística',
  'taller o conversatorio',
  'tomas culturales',
  'talleres formativos',
  'Asamblea en disiplinas',
];
export const DISCIPLINAS_EVENTO = [
  'Artes plásticas', 'artesanía', 'audiovisual', 'danza', 'gastronomía', 'literatura', 'música', 'teatro',
];
export const OBJETIVOS_TRANSFORMADORES = [
  'ECONOMÍA: MODERNIZACIÓN PRODUCTIVA',
  'ECONOMÍA: DIVERSIFICACIÓN MÁS ALLÁ DEL PETRÓLEO',
  'ECONOMÍA: DESARROLLO TECNOLÓGICO',
  'ECONOMÍA: FORTALECIMIENTO DE SECTORES COMO AGROALIMENTARIO Y TURISMO',
  'INDEPENDENCIA PLENA: REFUERZO DE LA SOBERANÍA NACIONAL FRENTE A BLOQUEOS E INJERENCIAS EXTERNAS',
  'PAZ, SEGURIDAD E INTEGRACIÓN TERRITORIAL: GARANTIZAR LA ESTABILIDAD INTERNA Y LA DEFENSA DEL PAIS',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: RESTITUCIÓN Y PROTECCIÓN DE DERECHOS SOCIALES',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: ATENCION A SECTORES VULNERABLES',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): NUEVOS MÉTODOS DE GOBIERNO',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): PROTECCIÓN AMBIENTAL',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): ENFRENTAMIENTO AL CAMBIO CLIMÁTICO Y DESARROLLO CIENTÍFICO-TECNOLÓGICO',
  'GEOPOLÍTICA: POSICIONAMIENTO DE VENEZUELA EN UN NUEVO ORDEN MUNDIAL MULTIPOLAR',
];
export const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const PARTICIPAR_KEYS = ['ninos', 'ninas', 'jovenes_masculinos', 'jovenes_femeninas', 'adultos_masculinos', 'adultos_femeninas'];

export const esEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const numeroEntero = (v, min = 0) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min ? n : null;
};
```

- [ ] **Step 4: Escribir `server/src/index.js`**

```js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

import { autenticar } from './auth.js';
import rutasAuth from './rutas/auth.js';
import rutasDashboard from './rutas/dashboard.js';
import rutasEventos from './rutas/eventos.js';
import rutasCultores from './rutas/cultores.js';
import rutasForo from './rutas/foro.js';
import rutasNoticias from './rutas/noticias.js';
import rutasUsuarios from './rutas/usuarios.js';
import rutasReportes from './rutas/reportes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const uploadsAbs = path.resolve(UPLOAD_DIR);
fs.mkdirSync(uploadsAbs, { recursive: true });
app.use('/uploads', express.static(uploadsAbs));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', rutasAuth);
app.use('/api/dashboard', autenticar, rutasDashboard);
app.use('/api/eventos', autenticar, rutasEventos);
app.use('/api/cultores', autenticar, rutasCultores);
app.use('/api/foro', rutasForo);
app.use('/api/noticias', rutasNoticias);
app.use('/api/usuarios', autenticar, rutasUsuarios);
app.use('/api/reportes', autenticar, rutasReportes);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT || 4000}`);
});
```

- [ ] **Step 5: Verificar arranque (con rutas aún vacías se crean los módulos pulsos en Task 4)**

Run: `npm --workspace server run dev` (en una terminal aparte)
Expected: `Servidor en http://localhost:4000` y **sin** errores de importación (Task 4 crea las rutas; si se ejecuta antes de Task 4 fallará con "Cannot find module" — por eso este paso se valida de nuevo al final de Task 4).

Run: `curl -s http://localhost:4000/api/health`
Expected: `{"ok":true}`

- [ ] **Step 6: Commit**

```bash
git add server/src/db.js server/src/auth.js server/src/validadores.js server/src/index.js
git commit -m "feat: core del servidor Express (db, auth, validadores, index)"
```

---

### Task 4: Autenticación (registro, login, logout, me)

**Files:**
- Create: `server/src/rutas/auth.js`

**Interfaces:**
- Consumes: `query` (db.js), `bcryptjs`, `esEmail`/`numeroEntero` (validadores.js), `firmarToken`/`COOKIE_NOMBRE`/`autenticar` (auth.js).
- Produce:
  - `POST /api/auth/registro` → `{ ok, usuario }`; sets cookie `mc_token`.
  - `POST /api/auth/login` → `{ ok, usuario }`; sets cookie.
  - `POST /api/auth/logout` → limpia cookie.
  - `GET /api/auth/me` → `{ usuario }` (requiere `autenticar`).

Jerarquía y redirección post-login:
- `POST /api/auth/registro`: solo tipos `cultor` o `publico` (publicado para staff por Task 18). Si `cultor`, inserta en `cultores` (edad calculada) y en `usuarios`.
- Redirección: `funcionario|admin|director_* → /panel`; `cultor|publico → /foro`.

- [ ] **Step 1: Escribir `server/src/rutas/auth.js`**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { firmarToken, COOKIE_NOMBRE, autenticar } from '../auth.js';
import { esEmail, numeroEntero, AREAS_TEMATICAS } from '../validadores.js';

const router = Router();
const ROLE_SELF_REGISTRABLES = ['cultor', 'publico'];

const calcularEdad = (fechaNacimiento) => {
  const nac = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

router.post('/registro', async (req, res) => {
  const { nombre_completo, email, telefono, tipo_usuario, password, cedula, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, trayectoria_anios, organizacion } = req.body || {};

  if (!nombre_completo?.trim() || !esEmail(email)) return res.status(400).json({ error: 'Nombre y correo válidos son obligatorios' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  if (!ROLE_SELF_REGISTRABLES.includes(tipo_usuario)) return res.status(400).json({ error: 'Tipo de usuario no permitido en auto-registro' });

  const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email.trim()]);
  if (existe.rows.length) return res.status(409).json({ error: 'El correo ya está registrado' });

  if (tipo_usuario === 'cultor') {
    if (!cedula?.trim() || !AREA_TEMATICAS.includes(area_tematica) || !disciplina?.trim() ||
        !municipio?.trim() || !parroquia?.trim() || !carnet_patria?.trim() ||
        !direccion?.trim() || !lugar_nacimiento?.trim() || !fecha_nacimiento?.trim()) {
      return res.status(400).json({ error: 'Faltan datos obligatorios de la ficha de cultor' });
    }
    const cedulaUnica = await query('SELECT id FROM cultores WHERE cedula = $1 OR correo = $2', [cedula.trim(), email.trim()]);
    if (cedulaUnica.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrado como cultor' });
  }

  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre_completo.trim(), email.trim(), telefono?.trim() || null, tipo_usuario, hash]
  );
  const usuario = r.rows[0];

  if (tipo_usuario === 'cultor') {
    const edad = calcularEdad(fecha_nacimiento);
    await query(
      `INSERT INTO cultores (nombres_apellidos, telefono, cedula, correo, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad, trayectoria_anios, organizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [nombre_completo.trim(), telefono?.trim() || '', cedula.trim(), email.trim(), area_tematica, disciplina.trim(), comuna?.trim() || '', municipio.trim(), parroquia.trim(), carnet_patria.trim(), direccion.trim(), lugar_nacimiento.trim(), fecha_nacimiento, edad, numeroEntero(trayectoria_anios, 0) ?? 0, organizacion?.trim() || '']
    );
  }

  res.cookie(COOKIE_NOMBRE, firmarToken(usuario), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.status(201).json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre_completo, email: usuario.email, tipo: usuario.tipo_usuario } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!esEmail(email) || typeof password !== 'string') return res.status(400).json({ error: 'Credenciales inválidas' });
  const r = await query('SELECT * FROM usuarios WHERE email = $1 AND activo = 1', [email.trim()]);
  const usuario = r.rows[0];
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  res.cookie(COOKIE_NOMBRE, firmarToken(usuario), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre_completo, email: usuario.email, tipo: usuario.tipo_usuario } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NOMBRE);
  res.json({ ok: true });
});

router.get('/me', autenticar, async (req, res) => {
  const r = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ usuario: r.rows[0] });
});

export default router;
```

- [ ] **Step 2: Verificar con curl**

Run: `curl -s -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@mincultura.gob.ve","password":"Admin.2026!"}' -c /tmp/cookies.txt`
Expected: `{"ok":true,"usuario":{"id":1,"nombre":"Administrador Sistema",...,"tipo":"admin"}}`

Run: `curl -s http://localhost:4000/api/auth/me -b /tmp/cookies.txt`
Expected: JSON con `"email":"admin@mincultura.gob.ve"`.

Run: `curl -s -X POST http://localhost:4000/api/auth/logout -b /tmp/cookies.txt && curl -s http://localhost:4000/api/auth/me -b /tmp/cookies.txt`
Expected: `{"ok":true}` seguido de `{"error":"No autenticado"}`.

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/auth.js
git commit -m "feat: autenticación con registro, login, logout y me"
```

---

### Task 5: Panel (stats por rol + próximos eventos)

**Files:**
- Create: `server/src/rutas/dashboard.js`

**Interfaces:**
- Consumes: `query`, `autenticar` (desde index.js montado como `/api/dashboard`), roles de `req.usuario.tipo`.
- Produces: `GET /api/dashboard` → `{ stats, proximosEventos }`.

Comportamiento (réplica de `dashboard.php:20-105`):
- Staff (`admin|director_general|director_operativo|funcionario`): total eventos, cultores, publicaciones y próximos 5 eventos.
- Cultor: sus publicaciones, sus comentarios, total de eventos y próximos 5 eventos.

- [ ] **Step 1: Escribir `server/src/rutas/dashboard.js`**

```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const esStaff = ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(req.usuario.tipo);
  let stats = {};

  if (esStaff) {
    const [ev, cu, pu] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM eventos WHERE activo = 1'),
      query('SELECT COUNT(*)::int AS total FROM cultores WHERE activo = 1'),
      query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE activo = 1'),
    ]);
    stats = {
      eventos: ev.rows[0].total,
      cultores: cu.rows[0].total,
      publicaciones: pu.rows[0].total,
    };
  } else {
    const [misPu, misCo, ev] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
      query('SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
      query('SELECT COUNT(*)::int AS total FROM eventos WHERE activo = 1'),
    ]);
    stats = {
      publicaciones: misPu.rows[0].total,
      comentarios: misCo.rows[0].total,
      eventos: ev.rows[0].total,
    };
  }

  const prox = await query(
    'SELECT * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 5'
  );
  res.json({ stats, proximosEventos: prox.rows });
});

export default router;
```

- [ ] **Step 2: Verificar**

Run: `curl -s http://localhost:4000/api/dashboard -b /tmp/cookies.txt`
Expected: `{"stats":{"eventos":1,"cultores":1,"publicaciones":1},"proximosEventos":[...]}`

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/dashboard.js
git commit -m "feat: endpoint de estadísticas por rol del panel"
```

---

### Task 6: CRUD de eventos + ejecutar (formulario Misión Cultura)

**Files:**
- Create: `server/src/rutas/eventos.js`

**Interfaces:**
- Consumes: `query`, `validadores.js` (arrays y `numeroEntero`), `req.usuario`.
- Produces (ruta montada bajo `autenticar` en `/api/eventos`):
  - `GET /api/eventos?mes=&anio=` — eventos del mes (staff y cultor).
  - `GET /api/eventos/areas/opciones` — para selects (si se usa).
  - `GET /api/eventos/nuevos` — próximos 3 eventos (usado en Inicio).
  - `POST /api/eventos` — crear evento (staff).
  - `PUT /api/eventos/:id` — editar evento (staff).
  - `POST /api/eventos/:id/ejecutar` — `estado_ejecucion` → `reportada` (staff).
  - `DELETE /api/eventos/:id` — blando (staff; autor solo si `correo_usuario` coincide, réplica `delete_event.php`).

Campos del formulario (orden y etiquetas de `calendario.php:360-598`):
`estado, municipio, parroquia, organizacion, tipo_organizacion, direccion, ubicacion_exacta, consejo_comunal, nombre_consejo, nombre_comuna, vocero_nombre, vocero_cedula, vocero_telefono, responsable_nombre, responsable_cedula, responsable_telefono, responsable_cargo, tipo_actividad, disciplina, nombre_actividad, objetivo, mes, fecha, hora, duracion, ninos, ninas, jovenes_masculinos, jovenes_femeninas, adultos_masculinos, adultos_femeninas`.

Validación estricta: `estado` ∈ `AREAS_VE`, `tipo_organizacion` ∈ lista, `responsable_cargo` ∈ `CARGOS_RESPONSABLE`, `tipo_actividad` ∈ `TIPOS_ACTIVIDAD`, `disciplina` ∈ `DISCIPLINAS_EVENTO`, `objetivo` ∈ `OBJETIVOS_TRANSFORMADORES`, `mes` ∈ `MESES` y `1..12`; `hora` formato `HH:MM:SS`; `fecha` ISO; participantes enteros `>=0`; `duracion` entero `>=1`.

- [ ] **Step 1: Escribir `server/src/rutas/eventos.js`**

```js
import { Router } from 'express';
import { query } from '../db.js';
import {
  AREAS_VE, TIPOS_ORGANIZACION, CARGOS_RESPONSABLE, TIPOS_ACTIVIDAD,
  DISCIPLINAS_EVENTO, OBJETIVOS_TRANSFORMADORES, MESES, PARTICIPAR_KEYS, numeroEntero,
} from '../validadores.js';

const router = Router();
const esStaff = (u) => ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(u.tipo);

const validarEvento = (b) => {
  const e = {};
  const req = [
    'estado', 'municipio', 'parroquia', 'organizacion', 'direccion', 'consejo_comunal',
    'nombre_comuna', 'vocero_nombre', 'vocero_cedula', 'vocero_telefono',
    'responsable_nombre', 'responsable_cedula', 'responsable_telefono', 'nombre_actividad',
  ];
  for (const k of req) {
    if (!b[k]?.trim()) return { error: `Campo obligatorio faltante: ${k}` };
    e[k] = b[k].trim();
  }
  if (!AREAS_VE.includes(e.estado)) return { error: 'Estado inválido' };
  if (!TIPOS_ORGANIZACION.includes(b.tipo_organizacion || 'comuna')) return { error: 'Tipo de organización inválido' };
  if (!CARGOS_RESPONSABLE.includes(b.responsable_cargo)) return { error: 'Cargo inválido' };
  if (!TIPOS_ACTIVIDAD.includes(b.tipo_actividad)) return { error: 'Tipo de actividad inválido' };
  if (!DISCIPLINAS_EVENTO.includes(b.disciplina)) return { error: 'Disciplina inválida' };
  if (!OBJETIVOS_TRANSFORMADORES.includes(b.objetivo)) return { error: 'Objetivo transformador inválido' };
  const mes = Number(b.mes);
  if (!MESES.includes(mes)) return { error: 'Mes inválido' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)) return { error: 'Fecha inválida' };
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(b.hora)) return { error: 'Hora inválida' };
  const duracion = numeroEntero(b.duracion, 1);
  if (duracion === null) return { error: 'Duración inválida' };
  const part = {};
  for (const k of PARTICIPAR_KEYS) {
    const n = numeroEntero(b[k]);
    if (n === null) return { error: `Participación inválida en ${k}` };
    part[k] = n;
  }
  e.tipo_organizacion = b.tipo_organizacion || 'comuna';
  e.ubicacion_exacta = b.ubicacion_exacta?.trim() || null;
  e.nombre_consejo = b.nombre_consejo?.trim() || null;
  e.mes = mes; e.fecha = b.fecha; e.hora = b.hora;
  e.duracion = duracion;
  Object.assign(e, part);
  return { evento: e };
};

const COLUMNAS_VALIDAS_ORDEN = { fecha: 1, nombre_actividad: 1, estado: 1, municipio: 1 };

router.get('/', async (req, res) => {
  const mes = Number(req.query.mes);
  const anio = Number(req.query.anio);
  const orderBy = COLUMNAS_VALIDAS_ORDEN[req.query.orderBy] ? req.query.orderBy : 'fecha';
  const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';
  if (mes && MESES.includes(mes) && anio) {
    const r = await query(
      `SELECT * FROM eventos WHERE activo = 1 AND mes = $1 AND EXTRACT(YEAR FROM fecha) = $2 ORDER BY fecha ${dir}, hora ASC`,
      [mes, anio]
    );
    return res.json({ eventos: r.rows });
  }
  const r = await query(`SELECT * FROM eventos WHERE activo = 1 ORDER BY fecha ${dir}, hora ASC`);
  res.json({ eventos: r.rows });
});

router.get('/nuevos', async (_req, res) => {
  const r = await query('SELECT * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 3');
  res.json({ eventos: r.rows });
});

router.post('/', esStaff ? async (req, res) => {
  const { evento, error } = validarEvento(req.body || {});
  if (error) return res.status(400).json({ error });
  const cols = Object.keys(evento);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await query(
    `INSERT INTO eventos (correo_usuario, ${cols.join(', ')}) VALUES ($1, ${vals.join(', ')}) RETURNING *`,
    [req.usuario.email, ...cols.map((c) => evento[c])]
  );
  res.status(201).json({ evento: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.put('/:id', esStaff ? async (req, res) => {
  const { evento, error } = validarEvento(req.body || {});
  if (error) return res.status(400).json({ error });
  const sets = Object.keys(evento).map((c, i) => `${c} = $${i + 2}`);
  const r = await query(
    `UPDATE eventos SET ${sets.join(', ')} WHERE id = $1 AND activo = 1 RETURNING *`,
    [req.params.id, ...Object.keys(evento).map((c) => evento[c])]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ evento: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.post('/:id/ejecutar', esStaff ? async (req, res) => {
  const r = await query(
    `UPDATE eventos SET estado_ejecucion = 'reportada' WHERE id = $1 AND activo = 1 RETURNING *`,
    [req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ evento: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.delete('/:id', async (req, res) => {
  const r = await query('SELECT * FROM eventos WHERE id = $1 AND activo = 1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  const evento = r.rows[0];
  if (!esStaff(req.usuario) && evento.correo_usuario !== req.usuario.email) {
    return res.status(403).json({ error: 'Solo el autor o personal autorizado puede eliminar' });
  }
  await query('UPDATE eventos SET activo = 0 WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Verificar CRUD con curl (login ya hecho en Task 4)**

Run: `curl -s -X POST http://localhost:4000/api/eventos -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"estado":"Miranda","municipio":"Sucre","parroquia":"Petare","organizacion":"Casa Cultural","tipo_organizacion":"comuna","direccion":"Plaza Bolívar","ubicacion_exacta":"Junto a la plaza","consejo_comunal":"Andrés Bello","nombre_consejo":"C.C. Andrés Bello","nombre_comuna":"Comuna Sucre","vocero_nombre":"Pedro Rojas","vocero_cedula":"V-9999999","vocero_telefono":"04140000000","responsable_nombre":"Lucía Méndez","responsable_cedula":"V-8888888","responsable_telefono":"04141111111","responsable_cargo":"Facilitador","tipo_actividad":"taller o conversatorio","disciplina":"literatura","nombre_actividad":"Taller de narración oral","objetivo":"POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR","mes":11,"fecha":"2026-11-05","hora":"15:00:00","duracion":3,"ninos":5,"ninas":6,"jovenes_masculinos":4,"jovenes_femeninas":3,"adultos_masculinos":8,"adultos_femeninas":7}'`
Expected: `201` con el evento creado (id 2).

Run: `curl -s -X PUT http://localhost:4000/api/eventos/2 -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"mes":12,"fecha":"2026-12-05"}'`
Expected: `400` (`Campo obligatorio faltante: estado`) — valida el formulario completo.

Run: `curl -s -X POST http://localhost:4000/api/eventos/2/ejecutar -b /tmp/cookies.txt`
Expected: `{"evento":{...,"estado_ejecucion":"reportada",...}}`

Run: `curl -s -X DELETE http://localhost:4000/api/eventos/2 -b /tmp/cookies.txt`
Expected: `{"ok":true}` y steps siguientes lo confirman con `GET`.

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/eventos.js
git commit -m "feat: CRUD de eventos con formulario Misión Cultura y ejecución"
```

---

### Task 7: CRUD de cultores + filtros

**Files:**
- Create: `server/src/rutas/cultores.js`

**Interfaces:**
- Consumes: `query`, `validadores.js`, `req.usuario`.
- Produces (montada en `/api/cultores`, protegida por `autenticar`):
  - `GET /api/cultores?area_tematica=&municipio=&q=` — listado con filtros (réplica `cultores.php:129-157`).
  - `GET /api/cultores/opciones` — `{ areas, municipios }` para selects (DISTINCT).
  - `GET /api/cultores/:id` — ficha completa.
  - `POST /api/cultores` — crear (staff).
  - `PUT /api/cultores/:id` — editar (staff).
  - `DELETE /api/cultores/:id` — blando (staff).

Validación: `area_tematica` ∈ `AREAS_TEMATICAS`, cedula/correo únicos, `edad` entero >=0, numéricos.

- [ ] **Step 1: Escribir `server/src/rutas/cultores.js`**

```js
import { Router } from 'express';
import { query } from '../db.js';
import { AREAS_TEMATICAS, numeroEntero } from '../validadores.js';

const router = Router();
const esStaff = (u) => ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(u.tipo);

const validarFicha = (b) => {
  const req = ['nombres_apellidos', 'telefono', 'cedula', 'correo', 'disciplina', 'comuna', 'municipio', 'parroquia', 'carnet_patria', 'direccion', 'lugar_nacimiento', 'fecha_nacimiento'];
  const f = {};
  for (const k of req) {
    if (!b[k]?.trim()) return { error: `Campo obligatorio faltante: ${k}` };
    f[k] = b[k].trim();
  }
  if (!AREAS_TEMATICAS.includes(b.area_tematica)) return { error: 'Área temática inválida' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha_nacimiento)) return { error: 'Fecha de nacimiento inválida' };
  for (const k of ['edad', 'trayectoria_anios']) {
    const n = numeroEntero(b[k]);
    if (n === null) return { error: `${k} inválido` };
    f[k] = n;
  }
  f.area_tematica = b.area_tematica;
  f.organizacion = b.organizacion?.trim() || '';
  return { ficha: f };
};

router.get('/', async (req, res) => {
  const cond = ['activo = 1'];
  const params = [];
  let i = 1;
  if (req.query.area_tematica) { cond.push(`area_tematica = $${i++}`); params.push(req.query.area_tematica); }
  if (req.query.municipio) { cond.push(`municipio = $${i++}`); params.push(req.query.municipio); }
  if (req.query.q) { cond.push(`(nombres_apellidos ILIKE $${i++} OR cedula ILIKE $${i++})`); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const r = await query(`SELECT * FROM cultores WHERE ${cond.join(' AND ')} ORDER BY nombres_apellidos ASC`, params);
  res.json({ cultores: r.rows });
});

router.get('/opciones', async (_req, res) => {
  const [areas, muns] = await Promise.all([
    query('SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 ORDER BY area_tematica'),
    query('SELECT DISTINCT municipio FROM cultores WHERE activo = 1 ORDER BY municipio'),
  ]);
  res.json({ areas: areas.rows.map((r) => r.area_tematica), municipios: muns.rows.map((r) => r.municipio) });
});

router.get('/:id', async (req, res) => {
  const r = await query('SELECT * FROM cultores WHERE id = $1 AND activo = 1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
});

router.post('/', esStaff ? async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  const exist = await query('SELECT id FROM cultores WHERE cedula = $1 OR correo = $2', [ficha.cedula, ficha.correo]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const cols = Object.keys(ficha);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await query(`INSERT INTO cultores (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`, cols.map((c) => ficha[c]));
  res.status(201).json({ cultor: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.put('/:id', esStaff ? async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  const exist = await query('SELECT id FROM cultores WHERE (cedula = $1 OR correo = $2) AND id != $3', [ficha.cedula, ficha.correo, req.params.id]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const sets = Object.keys(ficha).map((c, i) => `${c} = $${i + 1}`);
  const r = await query(`UPDATE cultores SET ${sets.join(', ')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.keys(ficha).map((c) => ficha[c]), req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.delete('/:id', esStaff ? async (req, res) => {
  const r = await query('UPDATE cultores SET activo = 0 WHERE id = $1 AND activo = 1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ ok: true });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

export default router;
```

- [ ] **Step 2: Verificar**

Run: `curl -s http://localhost:4000/api/cultores -b /tmp/cookies.txt`
Expected: `{"cultores":[{...María González...}]}`

Run: `curl -s http://localhost:4000/api/cultores?municipio=Libertador -b /tmp/cookies.txt`
Expected: 1 cultor.

Run: `curl -s -X DELETE http://localhost:4000/api/cultores/1 -b /tmp/cookies.txt`
Expected: `{"ok":true}` y `curl http://localhost:4000/api/cultores` devuelve lista vacía.
**Nota:** el cultor 1 del seed es quien sostiene la publicidad de ejemplo — restaurar con `npm --workspace server run db:init` antes de proseguir (el seed es idempotente y reconciliará los datos de prueba; no recrea datos creados por el usuario, pero aquí solo hay seed).

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/cultores.js
git commit -m "feat: CRUD de cultores con filtros y opciones"
```

---

### Task 8: Foro (publicaciones, likes, comentarios, uploads)

**Files:**
- Create: `server/src/rutas/foro.js`

**Interfaces:**
- Consumes: `query`, `multer`, `validadores.js` (`CATEGORIAS_FORO`), `autenticar` (desde index.js la ruta es pública a nivel base: `/api/foro` montada sin autenticar; cada endpoint decide — feed y página pública `GET`; las mutaciones exigen login).
- Produces:
  - `GET /api/foro` — feed ordenado por fecha DESC con `likes_count`, `comments_count` y `mio_like` (según sesión si hay cookie). Réplica de `foro.php:16-39`.
  - `POST /api/foro/publicaciones` (multipart) — crear publicación con archivo opcional (máx. 5 MB, MIME real, extensión en allowlist → `imagen|video|audio`). Requiere login.
  - `PUT /api/foro/publicaciones/:id` — editar (solo autor).
  - `DELETE /api/foro/publicaciones/:id` — blando (solo autor).
  - `POST /api/foro/publicaciones/:id/like` — toggle (UNIQUE `(publicacion_id, usuario_id)`). Requiere login.
  - `GET/POST /api/foro/publicaciones/:id/comentarios` — listar / agregar (login para POST).
  - Media servida estática en `/uploads/*` (index.js).

- [ ] **Step 1: Escribir `server/src/rutas/foro.js`**

```js
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { autenticar } from '../auth.js';
import { CATEGORIAS_FORO } from '../validadores.js';

const router = Router();

const EXT_TIPO = {
  '.jpg': 'imagen', '.jpeg': 'imagen', '.png': 'imagen', '.gif': 'imagen', '.webp': 'imagen',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
};
const MAX_BYTES = Number(process.env.MAX_FILE_SIZE) || 5242880;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXT_TIPO[ext]) return cb(new Error('Extensión no permitida'));
    cb(null, true);
  },
});

const feedSelect = `
  SELECT fp.*, u.nombre_completo AS autor_nombre,
    (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.id)::int AS likes_count,
    (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.id AND activo = 1)::int AS comments_count,
    EXISTS (SELECT 1 FROM foro_likes fl WHERE fl.publicacion_id = fp.id AND fl.usuario_id = $1) AS mio_like
  FROM foro_publicaciones fp
  LEFT JOIN usuarios u ON u.id = fp.usuario_id
  WHERE fp.activo = 1
`;

router.get('/', async (req, res) => {
  let miId = null;
  try {
    const token = req.cookies?.mc_token;
    if (token) miId = (await import('jsonwebtoken')).verify(token, process.env.JWT_SECRET).id;
  } catch { /* sesión opcional en vista pública */ }
  const r = await query(`${feedSelect} ORDER BY fp.fecha_publicacion DESC`, [miId ?? -1]);
  res.json({ publicaciones: r.rows });
});

router.post('/publicaciones', autenticar, upload.single('archivo'), async (req, res) => {
  const { titulo, categoria, descripcion } = req.body || {};
  if (!titulo?.trim() || !CATEGORIAS_FORO.includes(categoria) || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Título, categoría y descripción son obligatorios' });
  }
  let archivo_url = null, tipo_archivo = null;
  if (req.file) {
    archivo_url = `/uploads/${req.file.filename}`;
    tipo_archivo = EXT_TIPO[path.extname(req.file.originalname).toLowerCase()];
  }
  const r = await query(
    `INSERT INTO foro_publicaciones (usuario_id, titulo, categoria, descripcion, archivo_url, tipo_archivo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.usuario.id, titulo.trim(), categoria, descripcion.trim(), archivo_url, tipo_archivo]
  );
  res.status(201).json({ publicacion: r.rows[0] });
});

router.put('/publicaciones/:id', autenticar, upload.single('archivo'), async (req, res) => {
  const { titulo, categoria, descripcion } = req.body || {};
  const r = await query('SELECT * FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  const pub = r.rows[0];
  if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });
  if (pub.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el autor puede editar' });
  if (!titulo?.trim() || !CATEGORIAS_FORO.includes(categoria) || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Título, categoría y descripción son obligatorios' });
  }
  let archivo_url = pub.archivo_url, tipo_archivo = pub.tipo_archivo;
  if (req.file) {
    archivo_url = `/uploads/${req.file.filename}`;
    tipo_archivo = EXT_TIPO[path.extname(req.file.originalname).toLowerCase()];
  }
  const up = await query(
    'UPDATE foro_publicaciones SET titulo = $1, categoria = $2, descripcion = $3, archivo_url = $4, tipo_archivo = $5 WHERE id = $6 RETURNING *',
    [titulo.trim(), categoria, descripcion.trim(), archivo_url, tipo_archivo, req.params.id]
  );
  res.json({ publicacion: up.rows[0] });
});

router.delete('/publicaciones/:id', autenticar, async (req, res) => {
  const r = await query('SELECT * FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  const pub = r.rows[0];
  if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });
  if (pub.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el autor puede eliminar' });
  await query('UPDATE foro_publicaciones SET activo = 0 WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.post('/publicaciones/:id/like', autenticar, async (req, res) => {
  const pubId = Number(req.params.id);
  const usuarioId = req.usuario.id;
  const existe = await query('SELECT id FROM foro_likes WHERE publicacion_id = $1 AND usuario_id = $2', [pubId, usuarioId]);
  if (existe.rows.length) {
    await query('DELETE FROM foro_likes WHERE publicacion_id = $1 AND usuario_id = $2', [pubId, usuarioId]);
    return res.json({ liked: false });
  }
  await query('INSERT INTO foro_likes (publicacion_id, usuario_id) VALUES ($1, $2)', [pubId, usuarioId]);
  res.json({ liked: true });
});

router.get('/publicaciones/:id/comentarios', async (req, res) => {
  const r = await query(
    `SELECT fc.*, u.nombre_completo AS autor_nombre
     FROM foro_comentarios fc LEFT JOIN usuarios u ON u.id = fc.usuario_id
     WHERE fc.publicacion_id = $1 AND fc.activo = 1 ORDER BY fc.fecha_comentario ASC`,
    [req.params.id]
  );
  res.json({ comentarios: r.rows });
});

router.post('/publicaciones/:id/comentarios', autenticar, async (req, res) => {
  const { comentario } = req.body || {};
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });
  const pub = await query('SELECT id FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  if (!pub.rows.length) return res.status(404).json({ error: 'Publicación no encontrada' });
  const r = await query(
    `INSERT INTO foro_comentarios (publicacion_id, usuario_id, comentario) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.usuario.id, comentario.trim()]
  );
  res.status(201).json({ comentario: r.rows[0] });
});

export default router;
```

- [ ] **Step 2: Verificar**

Run: `curl -s http://localhost:4000/api/foro -b /tmp/cookies.txt`
Expected: feed con 1 publicación (la del seed).

Run: `curl -s -X POST http://localhost:4000/api/foro/publicaciones/1/like -b /tmp/cookies.txt`
Expected: `{"liked":true}`

Run: `curl -s -X POST http://localhost:4000/api/foro/publicaciones/1/comentarios -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"comentario":"Excelente iniciativa"}'`
Expected: `201` con el comentario.

Run: `curl -s -X POST http://localhost:4000/api/foro -F 'titulo=Prueba audio' -F 'categoria=musica' -F 'descripcion=subida de prueba' -F 'archivo=@server/.env.example' -b /tmp/cookies.txt`
Expected: `400` o `422`-like error (`Extensión no permitida`), nunca 201.

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/foro.js
git commit -m "feat: foro con publicaciones, likes, comentarios y subida de archivos"
```

---

### Task 9: Noticias públicas, usuarios (jerarquía) y perfil

**Files:**
- Create: `server/src/rutas/noticias.js`
- Create: `server/src/rutas/usuarios.js`

**Interfaces:**
- Consumes: `query`, `validadores.js`, `autenticar`, `req.usuario`.
- Produces:
  - `GET /api/noticias?limite=3` — públicas (portada). Seed ya trae noticias.
  - `POST /api/usuarios` — crear usuario staff (jerarquía: admin crea todo; `director_general` crea director_operativo/funcionario; `director_operativo` crea funcionario). Réplica `crear_usuario.php` (validación min. 6 contraseña como el original). Ver nota de seguridad abajo.
  - `GET /api/usuarios/me` — perfil propio + ficha de cultor si aplica.
  - `GET /api/usuarios/:id` — perfil público con publicaciones y stats (réplica `perfil.php:18-71`).
  - `PUT /api/usuarios/me` — actualizar nombre_completo y telefono (réplica `perfil.php` edición).

**Nota de seguridad (reemplaza la debilidad del original):** `tipo_usuario` del crear-usuario se valida contra la tabla de jerarquía, NUNCA se acepta `publico`/`cultor`/`admin` fuera de lo permitido. `admin` es el único que puede crear otro `admin`.

- [ ] **Step 1: Escribir `server/src/rutas/noticias.js`**

```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 3, 20);
  const r = await query(
    'SELECT id, titulo, contenido, imagen_url, fecha_publicacion FROM noticias WHERE activo = 1 ORDER BY fecha_publicacion DESC LIMIT $1',
    [limite]
  );
  res.json({ noticias: r.rows });
});

export default router;
```

- [ ] **Step 2: Escribir `server/src/rutas/usuarios.js`**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { esEmail } from '../validadores.js';

const router = Router();

const JERARQUIA = {
  admin: ['admin', 'director_general', 'director_operativo', 'funcionario'],
  director_general: ['director_operativo', 'funcionario'],
  director_operativo: ['funcionario'],
};

router.post('/', async (req, res) => {
  if (!JERARQUIA[req.usuario.tipo]) return res.status(403).json({ error: 'No autorizado para crear usuarios' });
  const { nombre_completo, email, telefono, tipo_usuario, password } = req.body || {};
  if (!JERARQUIA[req.usuario.tipo].includes(tipo_usuario)) {
    return res.status(403).json({ error: 'Tipo de usuario no permitido para su rol' });
  }
  if (!nombre_completo?.trim() || !esEmail(email)) return res.status(400).json({ error: 'Nombre y correo válidos son obligatorios' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });
  const exist = await query('SELECT id FROM usuarios WHERE email = $1', [email.trim()]);
  if (exist.rows.length) return res.status(409).json({ error: 'El correo ya está registrado' });
  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre_completo, email, tipo_usuario`,
    [nombre_completo.trim(), email.trim(), telefono?.trim() || null, tipo_usuario, hash]
  );
  res.status(201).json({ usuario: r.rows[0] });
});

router.get('/me', async (req, res) => {
  const u = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!u.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const cultor = await query('SELECT * FROM cultores WHERE correo = $1 AND activo = 1', [u.rows[0].email]);
  res.json({ usuario: u.rows[0], cultor: cultor.rows[0] || null });
});

router.put('/me', async (req, res) => {
  const { nombre_completo, telefono } = req.body || {};
  if (!nombre_completo?.trim()) return res.status(400).json({ error: 'Nombre obligatorio' });
  const r = await query(
    'UPDATE usuarios SET nombre_completo = $1, telefono = $2 WHERE id = $3 RETURNING id, nombre_completo, email, telefono, tipo_usuario',
    [nombre_completo.trim(), telefono?.trim() || null, req.usuario.id]
  );
  res.json({ usuario: r.rows[0] });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
  const u = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro FROM usuarios WHERE id = $1 AND activo = 1', [id]);
  if (!u.rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
  const usuario = u.rows[0];
  const [cultor, posts, totalCom, totalLikes, stats] = await Promise.all([
    query('SELECT * FROM cultores WHERE correo = $1 AND activo = 1', [usuario.email]),
    query(
      `SELECT fp.*, u.nombre_completo AS autor_nombre,
        (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.id)::int AS likes_count,
        (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.id AND activo = 1)::int AS comments_count
       FROM foro_publicaciones fp LEFT JOIN usuarios u ON u.id = fp.usuario_id
       WHERE fp.usuario_id = $1 AND fp.activo = 1 ORDER BY fp.fecha_publicacion DESC`,
      [id]
    ),
    query('SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE usuario_id = $1 AND activo = 1', [id]),
    query('SELECT COUNT(*)::int AS total FROM foro_likes WHERE publicacion_id IN (SELECT id FROM foro_publicaciones WHERE usuario_id = $1) AND usuario_id != $1', [id]),
    query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE usuario_id = $1 AND activo = 1', [id]),
  ]);
  res.json({
    usuario,
    cultor: cultor.rows[0] || null,
    publicaciones: posts.rows,
    stats: {
      comentarios: totalCom.rows[0].total,
      likes_recibidos: totalLikes.rows[0].total,
      publicaciones: stats.rows[0].total,
    },
  });
});

export default router;
```

- [ ] **Step 3: Verificar**

Run: `curl -s http://localhost:4000/api/noticias -b /tmp/cookies.txt`
Expected: `{"noticias":[{...Gran concierto...,...}]}` (3 noticias del seed).

Run: `curl -s http://localhost:4000/api/usuarios/me -b /tmp/cookies.txt`
Expected: `{"usuario":{...,"tipo":"admin",...},"cultor":null}`

Run: `curl -s http://localhost:4000/api/usuarios/1 -b /tmp/cookies.txt`
Expected: perfil del admin con `publicaciones:[...]` (la del seed) y `stats`.

Run (jerarquía): `curl -s -X POST http://localhost:4000/api/usuarios -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"nombre_completo":"Funcionario Test","email":"f.test@mincultura.gob.ve","telefono":"0414","tipo_usuario":"funcionario","password":"123456"}'`
Expected: `201`. Luego un `director_operativo` NO puede crear `admin` (403).

- [ ] **Step 4: Commit**

```bash
git add server/src/rutas/noticias.js server/src/rutas/usuarios.js
git commit -m "feat: noticias públicas, creación de usuarios por jerarquía y perfil"
```

---

### Task 10: Reportes con filtros (datos para el PDF)

**Files:**
- Create: `server/src/rutas/reportes.js`

**Interfaces:**
- Consumes: `query`, `validadores.js`, `req.usuario` (staff).
- Produces (montada en `/api/reportes`, protegida por `autenticar`):
  - `POST /api/reportes` → `{ tipo, vista, filas, columnas, resumen }` para el cliente.

Réplica de `reportes.php`:
- `tipo`: `eventos` | `cultores` | `usuarios` | `actividad_ejecutada` | `actividad_reportada`.
- `vista`: `general` (resumen por conteos) | `detallado` (filas completas).
- Filtros: `responsable` (LIKE nombre_actividad/nombre_comuna), `municipio`, `id_evento`, `area_tematica`, `tipo_usuario`, `fecha_desde`, `fecha_hasta`.
- `eventos`/`actividad_*` → `columnas` = las 32 del form (misma tabla que el HTML actual) con `asistentes` = suma de los 6 rangos.
- `cultores` → ficha completa. `usuarios` → fila del sistema con `password_hash` nunca incluido.
- Distribuciones: `cultores_por_area` y `eventos_por_disciplina` (para el PDF chart-like).
- También `GET /api/reportes/filtros` → `{ responsables, municipios, eventos, areas, tipos_usuario }` para poblar los selects (espejo de `reportes.php:985-1045`).

- [ ] **Step 1: Escribir `server/src/rutas/reportes.js`**

```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const APPLY = (condiciones, params, claves, cuerpo) => {
  let i = params.length + 1;
  const where = ['activo = 1'];
  for (const clave of claves) {
    const val = cuerpo[clave];
    if (!val) continue;
    if (clave === 'responsable') {
      where.push(`(nombre_actividad ILIKE $${i++} OR nombre_comuna ILIKE $${i++})`);
      params.push(`%${val}%`, `%${val}%`);
    } else if (clave === 'id_evento') {
      where.push(`id = $${i++}`);
      params.push(Number(val));
    } else if (clave === 'fecha_desde') {
      where.push(`fecha >= $${i++}`);
      params.push(val);
    } else if (clave === 'fecha_hasta') {
      where.push(`fecha <= $${i++}`);
      params.push(val);
    } else {
      where.push(`${clave} = $${i++}`);
      params.push(val);
    }
  }
  condiciones.push(`WHERE ${where.join(' AND ')}`);
};

router.get('/filtros', async (req, res) => {
  const [resp, muns, evs, areas, tipos] = await Promise.all([
    query('SELECT DISTINCT responsable_nombre AS r FROM eventos WHERE activo = 1 ORDER BY r'),
    query('SELECT DISTINCT municipio FROM eventos WHERE activo = 1 ORDER BY municipio'),
    query('SELECT DISTINCT id, nombre_actividad FROM eventos WHERE activo = 1 ORDER BY id'),
    query('SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 ORDER BY area_tematica'),
  ]);
  res.json({
    responsables: resp.rows.map((x) => x.r),
    municipios: muns.rows.map((x) => x.municipio),
    eventos: evs.rows,
    areas: areas.rows.map((x) => x.area_tematica),
    tipos_usuario: ['funcionario', 'cultor'],
  });
});

router.post('/', async (req, res) => {
  if (!['admin', 'director_general', 'director_operativo', 'funcionario'].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { tipo = 'eventos', vista = 'detallado', ...filtros } = req.body || {};
  const condiciones = [];
  const params = [];
  let queryStr = '';

  if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
    if (tipo !== 'eventos') {
      const estado = tipo === 'actividad_ejecutada' ? 'ejecutado' : 'reportada';
      condiciones.push(`WHERE activo = 1 AND estado_ejecucion = '${estado}'`);
    } else {
      APPLY(condiciones, params, ['responsable', 'municipio', 'id_evento', 'fecha_desde', 'fecha_hasta'], filtros);
    }
    queryStr = `SELECT *, (ninos + ninas + jovenes_masculinos + jovenes_femeninas + adultos_masculinos + adultos_femeninas) AS asistentes
                FROM eventos ${condiciones[0] || ''} ORDER BY fecha DESC`;
  } else if (tipo === 'cultores') {
    if (filtros.area_tematica || filtros.fecha_desde || filtros.fecha_hasta) {
      const where = ['activo = 1'];
      if (filtros.area_tematica) { params.push(filtros.area_tematica); where.push(`area_tematica = $${params.length}`); }
      if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
      if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
      condiciones.push(`WHERE ${where.join(' AND ')}`);
    }
    queryStr = `SELECT * FROM cultores ${condiciones[0] || ''} ORDER BY nombres_apellidos`;
  } else if (tipo === 'usuarios') {
    const where = ['activo = 1'];
    if (filtros.tipo_usuario) { params.push(filtros.tipo_usuario); where.push(`tipo_usuario = $${params.length}`); }
    if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
    if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
    condiciones.push(`WHERE ${where.join(' AND ')}`);
    queryStr = `SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro, activo FROM usuarios ${condiciones[0]} ORDER BY fecha_registro DESC`;
  } else {
    return res.status(400).json({ error: 'Tipo de reporte inválido' });
  }

  const r = await query(queryStr, params);
  const filas = r.rows;

  let resumen = {};
  if (vista === 'general') {
    if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
      resumen = { total: filas.length, asistentes: filas.reduce((s, f) => s + Number(f.asistentes), 0) };
    } else {
      resumen = { total: filas.length };
    }
  }

  const [porArea, porDisciplina] = await Promise.all([
    query('SELECT area_tematica, COUNT(*)::int AS total FROM cultores WHERE activo = 1 GROUP BY area_tematica ORDER BY area_tematica'),
    query('SELECT disciplina, COUNT(*)::int AS total FROM eventos WHERE activo = 1 GROUP BY disciplina ORDER BY disciplina'),
  ]);

  res.json({
    tipo, vista, filas, resumen,
    distribuciones: {
      cultores_por_area: porArea.rows,
      eventos_por_disciplina: porDisciplina.rows,
    },
  });
});

export default router;
```

- [ ] **Step 2: Verificar**

Run: `curl -s -X POST http://localhost:4000/api/reportes -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"tipo":"eventos","vista":"detallado","municipio":"Libertador"}'`
Expected: `{"tipo":"eventos","vista":"detallado","filas":[...],"resumen":{},"distribuciones":{...}}` con los eventos del seed.

Run: `curl -s -X POST http://localhost:4000/api/reportes -H 'Content-Type: application/json' -b /tmp/cookies.txt -d '{"tipo":"actividad_reportada","vista":"general"}'`
Expected: `filas:[]` (tras Task 6 se marcó reportada la actividad 2 que fue eliminada; no debe haber error).

Run: `curl -s http://localhost:4000/api/reportes/filtros -b /tmp/cookies.txt`
Expected: `{"responsables":["Ana López"],"municipios":["Libertador"],"eventos":[...],"areas":["musica"],"tipos_usuario":["funcionario","cultor"]}`

- [ ] **Step 3: Commit**

```bash
git add server/src/rutas/reportes.js
git commit -m "feat: endpoint de reportes con filtros, vistas y distribuciones"
```

---

### Task 11: Scaffold del cliente (Vite, router, api, contexto, estilos, layout)

**Files:**
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/public/favicon.jpg` (copiar `assets/favicon.jpg`)
- Create: `client/src/main.jsx`
- Create: `client/src/api.js`
- Create: `client/src/context/AuthContext.jsx`
- Create: `client/src/constantes.js`
- Create: `client/src/estilos/base.css`
- Create: `client/src/componentes/Bandera.jsx`
- Create: `client/src/componentes/Header.jsx`
- Create: `client/src/componentes/Footer.jsx`
- Create: `client/src/componentes/RequeridoLayout.jsx` (layout que exige login)

**Interfaces:**
- Consumes: dependencias de `client/package.json` (Task 1); endpoints del server (Tasks 4-10).
- Produces: SPA con rutas `/`, `/mision-vision`, `/marco-legal`, `/transparencia`, `/contacto`, `/login`, `/registro`, `/panel`, `/calendario`, `/cultores`, `/reportes`, `/crear-usuario`, `/foro`, `/perfil/:id`. Contexto `useAuth()` → `{ usuario, cultor, cargando, login(), logout(), registrar(), refrescar() }`. Helper `api(path, opciones)` con `credentials: 'include'`. Constantes compartidas (roles, meses, categorías, estados). CSS institucional base.

- [ ] **Step 1: Crear `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
```

- [ ] **Step 2: Crear `client/index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
    <title>Ministerio del Poder Popular para la Cultura</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Run: `cp assets/favicon.jpg client/public/favicon.jpg`

- [ ] **Step 3: Crear `client/src/api.js`**

```js
export async function api(path, opciones = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    ...opciones,
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}
```

- [ ] **Step 4: Crear `client/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cultor, setCultor] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = async () => {
    try {
      const { usuario: u, cultor: c } = await api('/api/usuarios/me');
      setUsuario(u);
      setCultor(c);
    } catch {
      setUsuario(null);
      setCultor(null);
    }
  };

  useEffect(() => {
    (async () => { await refrescar(); setCargando(false); })();
  }, []);

  const login = async (email, password) => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    await refrescar();
    return r;
  };

  const registrar = async (datos) => {
    const r = await api('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    await refrescar();
    return r;
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUsuario(null);
    setCultor(null);
  };

  const esStaff = usuario && ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(usuario.tipo);

  return (
    <AuthContext.Provider value={{ usuario, cultor, cargando, login, registrar, logout, refrescar, esStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 5: Crear `client/src/constantes.js`** (espejo del server para selects y etiquetas)

```js
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const AREAS_VE = ['Distrito Capital','Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo','Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo','Vargas','Yaracuy','Zulia'];
export const AREAS_TEMATICAS = { musica: 'Música', danza: 'Danza', teatro: 'Teatro', artesPlasticas: 'Artes Plásticas', literatura: 'Literatura', artesanias: 'Artesanías', cine: 'Cine', fotografia: 'Fotografía' };
export const CATEGORIAS_FORO = { danza: 'Danza', musica: 'Música', artesPlasticas: 'Artes Plásticas', poesia: 'Poesía', teatro: 'Teatro', cine: 'Cine', fotografia: 'Fotografía', artesanias: 'Artesanías' };
export const CARGOS_RESPONSABLE = ['Animador', 'Coordinador', 'Facilitador', 'Tutor'];
export const TIPOS_ORGANIZACION = { comuna: 'Comuna', circuito: 'Circuito Comunal' };
export const TIPOS_ACTIVIDAD = ['Cumpleaños viva Venezuela', 'despligues homenajes/ amor en acción/ jornada', 'Presentación artística', 'taller o conversatorio', 'tomas culturales', 'talleres formativos', 'Asamblea en disiplinas'];
export const DISCIPLINAS_EVENTO = ['Artes plásticas', 'artesanía', 'audiovisual', 'danza', 'gastronomía', 'literatura', 'música', 'teatro'];
export const OBJETIVOS_TRANSFORMADORES = [
  'ECONOMÍA: MODERNIZACIÓN PRODUCTIVA',
  'ECONOMÍA: DIVERSIFICACIÓN MÁS ALLÁ DEL PETRÓLEO',
  'ECONOMÍA: DESARROLLO TECNOLÓGICO',
  'ECONOMÍA: FORTALECIMIENTO DE SECTORES COMO AGROALIMENTARIO Y TURISMO',
  'INDEPENDENCIA PLENA: REFUERZO DE LA SOBERANÍA NACIONAL FRENTE A BLOQUEOS E INJERENCIAS EXTERNAS',
  'PAZ, SEGURIDAD E INTEGRACIÓN TERRITORIAL: GARANTIZAR LA ESTABILIDAD INTERNA Y LA DEFENSA DEL PAIS',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: RESTITUCIÓN Y PROTECCIÓN DE DERECHOS SOCIALES',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: ATENCION A SECTORES VULNERABLES',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): NUEVOS MÉTODOS DE GOBIERNO',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): PROTECCIÓN AMBIENTAL',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): ENFRENTAMIENTO AL CAMBIO CLIMÁTICO Y DESARROLLO CIENTÍFICO-TECNOLÓGICO',
  'GEOPOLÍTICA: POSICIONAMIENTO DE VENEZUELA EN UN NUEVO ORDEN MUNDIAL MULTIPOLAR',
];
export const TIPOS_USUARIO = { admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo', funcionario: 'Funcionario', cultor: 'Cultor', publico: 'Público en general' };
export const ESTADO_EJECUCION = { registrado: 'Registrado', ejecutado: 'Ejecutado', reportada: 'Reportada' };
```

- [ ] **Step 6: Crear `client/src/estilos/base.css`** (identidad institucional completa)

```css
:root {
  --amarillo: #FFD700;
  --azul: #003893;
  --rojo: #CF142B;
  --sombra: 0 2px 8px rgba(0, 0, 0, 0.12);
  --borde: #e2e2e2;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f4; color: #1c1c1c; line-height: 1.5; }
h1, h2, h3 { font-family: Georgia, 'Times New Roman', serif; }
a { color: var(--azul); text-decoration: none; }
button { cursor: pointer; }

.bandera { display: grid; grid-template-columns: 1fr 1fr 1fr; height: 7px; }
.bandera .amarilla { background: var(--amarillo); }
.bandera .azul { background: var(--azul); position: relative; }
.bandera .roja { background: var(--rojo); }
.bandera .azul .estrellas { position: absolute; inset: 0; display: flex; justify-content: space-evenly; align-items: center; color: #fff; font-size: 4px; letter-spacing: 2px; }

.cabecera { background: #fff; box-shadow: var(--sombra); }
.cabecera-interno { max-width: 1200px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.cabecera .logo-img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--amarillo); }
.cabecera .titulos h1 { margin: 0; font-size: 18px; color: var(--azul); }
.cabecera .titulos p { margin: 0; font-size: 13px; color: #555; }
nav.menu { margin-left: auto; }
nav.menu ul { list-style: none; display: flex; gap: 4px; margin: 0; padding: 0; flex-wrap: wrap; }
nav.menu a { display: block; padding: 8px 12px; border-radius: 4px; font-size: 14px; }
nav.menu a:hover { background: var(--amarillo); }
nav.menu a.activo { background: var(--azul); color: #fff; }

.contenedor { max-width: 1200px; margin: 0 auto; padding: 24px 20px; }
.tarjeta { background: #fff; border-radius: 8px; box-shadow: var(--sombra); padding: 20px; margin-bottom: 20px; }
.grilha { display: grid; gap: 20px; }
.grilha-3 { grid-template-columns: repeat(3, 1fr); }
.grilha-2 { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 900px) { .grilha-3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .grilha-3, .grilha-2 { grid-template-columns: 1fr; } }

.btn { display: inline-block; padding: 9px 16px; border: none; border-radius: 4px; background: var(--rojo); color: #fff; font-size: 14px; }
.btn:hover { filter: brightness(1.1); }
.btn-sec { background: var(--azul); }
.btn-bajo { background: #e8e8e8; color: #333; }
.campo { margin-bottom: 14px; }
.campo label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: var(--azul); text-transform: uppercase; }
.campo input, .campo select, .campo textarea { width: 100%; padding: 9px 10px; border: 1px solid var(--borde); border-radius: 4px; font-size: 14px; }
.campo input:focus, .campo select:focus, .campo textarea:focus { outline: 2px solid var(--azul); outline-offset: -1px; }

.aviso { padding: 12px 14px; border-radius: 4px; margin-bottom: 16px; }
.aviso-error { background: #fdecea; color: #a00; border: 1px solid #f5b5ae; }
.aviso-ok { background: #eaf7ee; color: #0a6; border: 1px solid #a9e2bd; }

.pie { background: var(--azul); color: #fff; margin-top: 40px; }
.pie-interno { max-width: 1200px; margin: 0 auto; padding: 24px 20px; display: grid; gap: 20px; grid-template-columns: repeat(4, 1fr); }
@media (max-width: 900px) { .pie-interno { grid-template-columns: repeat(2, 1fr); } }
.pie a { color: #ffe58f; }
.pie-copia { text-align: center; padding: 10px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 13px; }
@media (max-width: 640px) { .pie-interno { grid-template-columns: 1fr; } }
```

- [ ] **Step 7: Crear `client/src/componentes/Bandera.jsx`** (tricolor con 8 estrellas en la franja azul)

```jsx
export default function Bandera() {
  return (
    <div className="bandera" aria-hidden="true">
      <div className="amarilla" />
      <div className="azul">
        <div className="estrellas">★ ★ ★ ★ ★ ★ ★ ★</div>
      </div>
      <div className="roja" />
    </div>
  );
}
```

- [ ] **Step 8: Crear `client/src/componentes/Header.jsx`**

```jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { usuario, logout, esStaff } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="cabecera">
      <div className="cabecera-interno">
        <Link to="/" className="logo-img-item"><img className="logo-img" src="/favicon.jpg" alt="Logo del Ministerio del Poder Popular para la Cultura" /></Link>
        <div className="titulos">
          <h1>República Bolivariana de Venezuela</h1>
          <h2 style={{ margin: 0, fontSize: 15, color: '#333', fontFamily: 'Georgia, serif' }}>Ministerio del Poder Popular para la Cultura</h2>
          <p>Misión Cultura</p>
        </div>
        <nav className="menu">
          <ul>
            <li><NavLink to="/" end={true}>Inicio</NavLink></li>
            <li><NavLink to="/foro">Foro</NavLink></li>
            {esStaff && <li><NavLink to="/panel">Panel</NavLink></li>}
            {esStaff && <li><NavLink to="/calendario">Calendario</NavLink></li>}
            {esStaff && <li><NavLink to="/cultores">Cultores</NavLink></li>}
            {esStaff && <li><NavLink to="/reportes">Reportes</NavLink></li>}
            {(usuario?.tipo === 'admin' || usuario?.tipo === 'director_general' || usuario?.tipo === 'director_operativo') && <li><NavLink to="/crear-usuario">Crear Usuario</NavLink></li>}
            {usuario ? (
              <>
                <li><NavLink to={`/perfil/${usuario.id}`}>Mi Perfil</NavLink></li>
                <li><button className="btn-bajo" onClick={salir}>Cerrar Sesión</button></li>
              </>
            ) : (
              <>
                <li><NavLink to="/login">Iniciar Sesión</NavLink></li>
                <li><NavLink to="/registro">Registro</NavLink></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 9: Crear `client/src/componentes/Footer.jsx`**

```jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="pie">
      <div className="pie-interno">
        <div>
          <h3>Ministerio de Cultura</h3>
          <p>República Bolivariana de Venezuela</p>
          <p>Av. Panteón, Foro Libertador</p>
          <p>Caracas, Venezuela</p>
        </div>
        <div>
          <h3>Enlaces Rápidos</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/mision-vision">Misión y Visión</Link></li>
            <li><Link to="/marco-legal">Marco Legal</Link></li>
            <li><Link to="/transparencia">Transparencia</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h3>Servicios</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/registro">Registro Cultural</Link></li>
            <li><Link to="/calendario">Eventos</Link></li>
            <li><Link to="/foro">Foro Comunitario</Link></li>
          </ul>
        </div>
        <div>
          <h3>Administración</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/panel">Panel</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
          </ul>
        </div>
      </div>
      <div className="pie-copia">
        <p>© 2026 Ministerio del Poder Popular para la Cultura - Todos los derechos reservados</p>
        <p>Realizado por Rodolfo Gómez</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: Crear `client/src/componentes/RequeridoLayout.jsx`** (caja que exige autenticación)

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequeridoLayout({ roles }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="contenedor">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.tipo)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

- [ ] **Step 11: Crear `client/src/main.jsx`** (router completo; algunas páginas se crean en Tasks 12-20)

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './estilos/base.css';
import Header from './componentes/Header';
import Footer from './componentes/Footer';
import Bandera from './componentes/Bandera';
import RequeridoLayout from './componentes/RequeridoLayout';
import Inicio from './paginas/Inicio';
import MisionVision from './paginas/MisionVision';
import MarcoLegal from './paginas/MarcoLegal';
import Transparencia from './paginas/Transparencia';
import Contacto from './paginas/Contacto';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Foro from './paginas/Foro';
import Perfil from './paginas/Perfil';
import Panel from './paginas/Panel';
import Calendario from './paginas/Calendario';
import Cultores from './paginas/Cultores';
import Reportes from './paginas/Reportes';
import CrearUsuario from './paginas/CrearUsuario';

const ROLES_STAFF = ['admin', 'director_general', 'director_operativo', 'funcionario'];
const ROLES_JEFE = ['admin', 'director_general', 'director_operativo'];

function Layout() {
  return (
    <>
      <Bandera />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/mision-vision" element={<MisionVision />} />
            <Route path="/marco-legal" element={<MarcoLegal />} />
            <Route path="/transparencia" element={<Transparencia />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/foro" element={<Foro />} />
            <Route path="/perfil/:id" element={<Perfil />} />
            <Route element={<RequeridoLayout roles={ROLES_STAFF} />}>
              <Route path="/panel" element={<Panel />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/cultores" element={<Cultores />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>
            <Route element={<RequeridoLayout roles={ROLES_JEFE} />}>
              <Route path="/crear-usuario" element={<CrearUsuario />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 12: Crear los 14 archivos placeholder de las páginas** (para que el build compile ahora; Tasks 12-20 los reemplazan). Cada uno:

```jsx
export default function Inicio() {
  return <div className="contenedor">Página en construcción</div>;
}
```

- [ ] **Step 13: Verificar arranque**

Run: `npm --workspace client run build`
Expected: build terminado sin errores (`dist/` generado).

Run: `npm --workspace client run dev` (terminal B). Abrir http://localhost:5173/
Expected: se ve la bandera tricolor, cabecera institucional, pie, y "Página en construcción" en el índice.

- [ ] **Step 14: Commit**

```bash
git add client/vite.config.js client/index.html client/public client/src
git commit -m "feat: scaffold SPA React con identidad institucional, router y auth context"
```

---

### Task 12: Páginas públicas (Inicio, Misión y Visión, Marco Legal, Transparencia, Contacto)

**Files:**
- Modify: `client/src/paginas/Inicio.jsx`
- Modify: `client/src/paginas/MisionVision.jsx`
- Modify: `client/src/paginas/MarcoLegal.jsx`
- Modify: `client/src/paginas/Transparencia.jsx`
- Modify: `client/src/paginas/Contacto.jsx`
- Add a reusable hook `client/src/hooks/useDatos.js` (tiny fetch wrapper con estado).

**Interfaces:**
- Consumes: `api()`, `useAuth()`, estilos de Task 11.
- Produces: Inicio (noticias del `GET /api/noticias`, próximos eventos `GET /api/eventos/nuevos`, CTA a registro/foro); páginas institucionales estáticas fieles al discurso del ministerio; Contacto con canales (denuncia/correos/telefónico, sustituye enlaces muertos; sin backend de envío — formulario local simulado).

- [ ] **Step 1: Crear `client/src/hooks/useDatos.js`**

```js
import { useEffect, useState } from 'react';
import { api } from '../api';

// ponytail: fetch con estado en ~20 líneas; un data-fetching lib si el proyecto crece
export default function useDatos(path, deps = []) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let vivo = true;
    api(path)
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { datos, error };
}
```

- [ ] **Step 2: Reescribir `client/src/paginas/Inicio.jsx`**

```jsx
import { Link } from 'react-router-dom';
import useDatos from '../hooks/useDatos';
import { MESES } from '../constantes';

export default function Inicio() {
  const { datos: noticias, error: errNoticias } = useDatos('/api/noticias?limite=3');
  const { datos: eventos, error: errEventos } = useDatos('/api/eventos/nuevos');

  const fechaEvento = (e) => {
    const d = new Date(e.fecha);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  };

  return (
    <div className="contenedor">
      <section className="tarjeta" style={{ background: 'linear-gradient(135deg, var(--azul) 0%, #0a2a6e 100%)', color: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Misión Cultura</h2>
        <p style={{ fontSize: 18 }}>
          El Ministerio del Poder Popular para la Cultura impulsa el desarrollo cultural del
          pueblo venezolano, promoviendo la participación popular y la defensa de la identidad nacional.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn" to="/registro" style={{ color: '#fff' }}>Registrarme</Link>
          <Link className="btn btn-sec" to="/foro" style={{ color: '#fff' }}>Visitar el Foro</Link>
        </div>
      </section>

      <h2>Noticias</h2>
      {errNoticias && <div className="aviso aviso-error">{errNoticias}</div>}
      <div className="grilha grilha-3">
        {(noticias?.noticias || []).map((n) => (
          <article className="tarjeta" key={n.id}>
            <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{n.titulo}</h3>
            <p>{n.contenido}</p>
            <small>{new Date(n.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}</small>
          </article>
        ))}
      </div>

      <h2>Próximos Eventos</h2>
      {errEventos && <div className="aviso aviso-error">{errEventos}</div>}
      <div className="grilha grilha-3">
        {(eventos?.eventos || []).map((e) => (
          <article className="tarjeta" key={e.id}>
            <h3 style={{ marginTop: 0 }}>{e.nombre_actividad}</h3>
            <p>{e.disciplina} — {e.municipio}, {e.estado}</p>
            <p><strong>{fechaEvento(e)}</strong> · {e.hora?.slice(0, 5)} h</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Reescribir `client/src/paginas/MisionVision.jsx`**

```jsx
export default function MisionVision() {
  return (
    <div className="contenedor">
      <h2>Misión y Visión</h2>
      <div className="grilha grilha-2">
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)' }}>Misión</h3>
          <p>
            Garantizar el derecho del pueblo venezolano a la cultura, impulsando la creación,
            la producción, la circulación y el disfrute de los bienes culturales, así como la
            formación integral de los cultores y cultoras, fortaleciendo la identidad nacional
            y el poder popular cultural.
          </p>
        </section>
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)' }}>Visión</h3>
          <p>
            Ser la institución rectora de la política cultural del Estado venezolano, consolidando
            un modelo de gestión participativo y protagónico donde las comunidades sean las
            protagonistas del desarrollo cultural, en el marco del Plan de la Patria y de una
            geopolítica internacional multipolar.
          </p>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Reescribir `client/src/paginas/MarcoLegal.jsx`**

```jsx
const NORMAS = [
  ['Constitución de la República Bolivariana de Venezuela', 'Artículo 98: creación cultural libre; Artículo 99: valores de la cultura; Artículo 100: culturas populares y expresiones tradicionales.'],
  ['Ley de Protección y Defensa del Patrimonio Cultural', 'Protección, defensa, registro y salvaguarda del patrimonio cultural tangible e intangible de la Nación.'],
  ['Ley del Instituto de las Artes Escénicas y Musicales', 'Fomento, promoción y difusión de las artes escénicas y la música.'],
  ['Ley del Libro', 'Fomento de la lectura y la producción literaria nacional.'],
  ['Ley de la Cinematografía Nacional', 'Ordenamiento jurídico para el desarrollo de la cinematografía venezolana.'],
  ['Ley del Artesano y la Artesana', 'Reconocimiento y protección del trabajo artesanal como expresión del pueblo.'],
];

export default function MarcoLegal() {
  return (
    <div className="contenedor">
      <h2>Marco Legal</h2>
      <p>El quehacer del Ministerio se sustenta en el ordenamiento jurídico venezolano:</p>
      {NORMAS.map(([titulo, texto]) => (
        <section className="tarjeta" key={titulo}>
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{titulo}</h3>
          <p>{texto}</p>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Reescribir `client/src/paginas/Transparencia.jsx`**

```jsx
const SECCIONES = [
  ['Principios', 'Acceso oportuno y gratuito a la información sobre gestión, presupuesto y resultados del Ministerio.'],
  ['Salarios y personal', 'Estructura de personal y escalas salariales publicadas conforme a la normativa vigente.'],
  ['Contrataciones', 'Publicación de procesos de contratación pública y adjudicaciones en el sistema nacional.'],
  ['Inversión cultural', 'Programas de financiamiento y de la Misión Cultura: partidas, beneficiarios y estados de ejecución.'],
];

export default function Transparencia() {
  return (
    <div className="contenedor">
      <h2>Transparencia y Acceso a la Información</h2>
      <p>
        Conforme a la Ley de Transparencia del Sector Público, este portal publica la información
        relativa a la gestión institucional.
      </p>
      <div className="grilha grilha-2">
        {SECCIONES.map(([t, d]) => (
          <section className="tarjeta" key={t}>
            <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{t}</h3>
            <p>{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Reescribir `client/src/paginas/Contacto.jsx`**

```jsx
import { useState } from 'react';
import { api } from '../api';

const CANALES = [
  ['Sede principal', 'Av. Panteón, Foro Libertador, Caracas 1010, Distrito Capital'],
  ['Atención telefónica', '+58 212-482-0000 (lunes a viernes, 8:00 a 16:00)'],
  ['Correo institucional', 'contacto@mincultura.gob.ve'],
  ['Foro de denuncias', 'A través del foro comunitario de este portal'],
];

export default function Contacto() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    // ponytail: sin backend de mensajería (no existía); simula envío y confirma
    setEstado(`Gracias ${nombre}, tu mensaje fue recibido. Nuestro equipo te responderá a ${correo}.`);
    setNombre(''); setCorreo(''); setMensaje('');
  };

  return (
    <div className="contenedor">
      <h2>Contacto</h2>
      <div className="grilha grilha-2">
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Canales institucionales</h3>
          {CANALES.map(([t, d]) => (
            <p key={t}><strong>{t}:</strong> {d}</p>
          ))}
        </section>
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Escríbenos</h3>
          {estado && <div className="aviso aviso-ok">{estado}</div>}
          <form onSubmit={enviar}>
            <div className="campo">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <div className="campo">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" rows="5" value={mensaje} onChange={(e) => setMensaje(e.target.value)} required />
            </div>
            <button className="btn" type="submit">Enviar</button>
          </form>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verificar**

Run: `npm --workspace client run build`
Expected: build exitoso. Navegar en http://localhost:5173/ (dev) por las 5 páginas públicas: contenido institucional, noticias y eventos cargando desde la API (con el server corriendo).

- [ ] **Step 8: Commit**

```bash
git add client/src/paginas/Inicio.jsx client/src/paginas/MisionVision.jsx client/src/paginas/MarcoLegal.jsx client/src/paginas/Transparencia.jsx client/src/paginas/Contacto.jsx client/src/hooks/useDatos.js
git commit -m "feat: páginas públicas con contenido institucional e inicio dinámico"
```

---

### Task 13: Login y Registro

**Files:**
- Modify: `client/src/paginas/Login.jsx`
- Modify: `client/src/paginas/Registro.jsx`

**Interfaces:**
- Consumes: `useAuth()` (`login`, `registrar`, `usuario`), `api`, constantes (áreas temáticas).
- Producеs: redirección post-login — `funcionario|admin|director_*` → `/panel`; `cultor|publico` → `/foro`. Si ya hay sesión, redirige a su destino.

- [ ] **Step 1: Reescribir `client/src/paginas/Login.jsx`**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const destinoSegunRol = (tipo) =>
  ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(tipo) ? '/panel' : '/foro';

export default function Login() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (usuario) {
    navigate(destinoSegunRol(usuario.tipo), { replace: true });
    return null;
  }

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const r = await login(email, password);
      navigate(destinoSegunRol(r.usuario.tipo), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="tarjeta">
        <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>Iniciar Sesión</h2>
        {error && <div className="aviso aviso-error">{error}</div>}
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
        <p style={{ marginTop: 16 }}>
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Reescribir `client/src/paginas/Registro.jsx`** (formulario completo de cultor → `tipo_usuario=cultor` muestra la ficha)

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AREAS_TEMATICAS } from '../constantes';

const destinoSegunRol = (tipo) =>
  ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(tipo) ? '/panel' : '/foro';

const inicial = {
  nombre_completo: '', email: '', telefono: '', tipo_usuario: 'publico',
  password: '', password_confirm: '',
  cedula: '', area_tematica: '', disciplina: '', comuna: '', municipio: '', parroquia: '',
  carnet_patria: '', direccion: '', lugar_nacimiento: '', fecha_nacimiento: '',
  trayectoria_anios: '', organizacion: '',
};

export default function Registro() {
  const { registrar, usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (usuario) {
    navigate(destinoSegunRol(usuario.tipo), { replace: true });
    return null;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password_confirm) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    try {
      const { password_confirm, tipo_usuario, ...datos } = form;
      const r = await registrar({ ...datos, tipo_usuario });
      navigate(destinoSegunRol(r.usuario.tipo), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const esCultor = form.tipo_usuario === 'cultor';

  return (
    <div className="contenedor" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="tarjeta">
        <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>Registro Cultural</h2>
        {error && <div className="aviso aviso-error">{error}</div>}
        <form onSubmit={enviar}>
          <h3 style={{ color: 'var(--rojo)' }}>Datos de la cuenta</h3>
          <div className="campo">
            <label htmlFor="nombre_completo">Nombre completo *</label>
            <input id="nombre_completo" value={form.nombre_completo} onChange={set('nombre_completo')} required />
          </div>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="email">Correo electrónico *</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="campo">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" type="tel" value={form.telefono} onChange={set('telefono')} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="tipo_usuario">Tipo de usuario *</label>
            <select id="tipo_usuario" value={form.tipo_usuario} onChange={set('tipo_usuario')} required>
              <option value="cultor">Cultor</option>
              <option value="publico">Público en general</option>
            </select>
          </div>

          {esCultor && (
            <>
              <h3 style={{ color: 'var(--rojo)' }}>Información del Cultor</h3>
              <div className="grilha grilha-2">
                <div className="campo">
                  <label htmlFor="cedula">Cédula *</label>
                  <input id="cedula" value={form.cedula} onChange={set('cedula')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="area_tematica">Área temática *</label>
                  <select id="area_tematica" value={form.area_tematica} onChange={set('area_tematica')} required={esCultor}>
                    <option value="">Seleccionar...</option>
                    {Object.entries(AREAS_TEMATICAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="disciplina">Disciplina *</label>
                  <input id="disciplina" value={form.disciplina} onChange={set('disciplina')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="comuna">Comuna</label>
                  <input id="comuna" value={form.comuna} onChange={set('comuna')} />
                </div>
                <div className="campo">
                  <label htmlFor="municipio">Municipio *</label>
                  <input id="municipio" value={form.municipio} onChange={set('municipio')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="parroquia">Parroquia *</label>
                  <input id="parroquia" value={form.parroquia} onChange={set('parroquia')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="carnet_patria">Código Carnet Patria *</label>
                  <input id="carnet_patria" value={form.carnet_patria} onChange={set('carnet_patria')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="direccion">Dirección exacta de domicilio *</label>
                  <input id="direccion" value={form.direccion} onChange={set('direccion')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="lugar_nacimiento">Lugar de nacimiento *</label>
                  <input id="lugar_nacimiento" value={form.lugar_nacimiento} onChange={set('lugar_nacimiento')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="fecha_nacimiento">Fecha de nacimiento *</label>
                  <input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="trayectoria_anios">Años de trayectoria *</label>
                  <input id="trayectoria_anios" type="number" min="0" max="100" value={form.trayectoria_anios} onChange={set('trayectoria_anios')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="organizacion">Organización social</label>
                  <input id="organizacion" value={form.organizacion} onChange={set('organizacion')} />
                </div>
              </div>
            </>
          )}

          <h3 style={{ color: 'var(--rojo)' }}>Contraseña</h3>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="password">Contraseña *</label>
              <input id="password" type="password" minLength={8} value={form.password} onChange={set('password')} required />
              <small>Mínimo 8 caracteres</small>
            </div>
            <div className="campo">
              <label htmlFor="password_confirm">Confirmar contraseña *</label>
              <input id="password_confirm" type="password" minLength={8} value={form.password_confirm} onChange={set('password_confirm')} required />
            </div>
          </div>

          <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Registrando…' : 'Registrarme'}</button>
          <p style={{ marginTop: 16 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar manual (con server y client en dev)**

Registrarse como `publico` (correo nuevo): debe redirigir a `/foro`.
Registrarse como `cultor` con la ficha completa: creado en `usuarios` + `cultores`.
Login con datos inválidos: muestra el aviso rojo.
Login `admin@mincultura.gob.ve` / `Admin.2026!`: redirige a `/panel`.

Run: `npm --workspace client run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add client/src/paginas/Login.jsx client/src/paginas/Registro.jsx
git commit -m "feat: login con redirección por rol y registro de cultor/público"
```

---

### Task 14: Panel (dashboard por rol)

**Files:**
- Modify: `client/src/paginas/Panel.jsx`

**Interfaces:**
- Consumes: `useDatos('/api/dashboard')`, `useAuth()` (`usuario`, `esStaff` para encabezado), `MESES`/`ESTADO_EJECUCION` (formateo).
- Produces: tarjetas de stats según rol y lista de los próximos 5 eventos con enlace al calendario.

- [ ] **Step 1: Reescribir `client/src/paginas/Panel.jsx`**

```jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { MESES, ESTADO_EJECUCION } from '../constantes';

export default function Panel() {
  const { usuario } = useAuth();
  const { datos, error } = useDatos('/api/dashboard');

  const fmt = (e) => {
    const d = new Date(e.fecha);
    return `${d.getDate()} ${MESES[d.getMonth()]}, ${e.hora?.slice(0, 5)} h`;
  };

  return (
    <div className="contenedor">
      <h2>Panel de Gestión</h2>
      <p>Bienvenido, <strong>{usuario?.nombre_completo}</strong></p>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="grilha grilha-3">
        {datos && Object.entries(datos.stats || {}).map(([k, v]) => (
          <div className="tarjeta" key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--azul)' }}>{v}</div>
            <div style={{ textTransform: 'uppercase', color: '#666', fontSize: 13 }}>
              {k === 'eventos' ? 'Eventos' : k === 'cultores' ? 'Cultores' : k === 'publicaciones' ? 'Publicaciones' : k === 'comentarios' ? 'Comentarios' : k}
            </div>
          </div>
        ))}
      </div>

      <h3>Próximos Eventos</h3>
      <div className="grilha">
        {(datos?.proximosEventos || []).map((e) => (
          <div className="tarjeta" key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong>{e.nombre_actividad}</strong>
              <div style={{ color: '#555', fontSize: 14 }}>{e.municipio}, {e.estado} · {fmt(e)}</div>
            </div>
            <span className="btn" style={{ display: 'inline-block', padding: '4px 10px', fontSize: 12 }}>{ESTADO_EJECUCION[e.estado_ejecucion] || e.estado_ejecucion}</span>
          </div>
        ))}
      </div>
      <Link className="btn btn-sec" to="/calendario">Ir al Calendario</Link>
    </div>
  );
}
```

- [ ] **Step 2: Verificar con sesión de admin (dev)**

Run: build + navegar `/panel` con login admin.
Expected: 3 tarjetas de stats (Eventos/Cultores/Publicaciones) y el evento seed listado como próximo.

- [ ] **Step 3: Commit**

```bash
git add client/src/paginas/Panel.jsx
git commit -m "feat: panel con estadísticas por rol y próximos eventos"
```

---

### Task 15: Calendario (vista mensual + formulario Misión Cultura completo)

**Files:**
- Modify: `client/src/paginas/Calendario.jsx`

**Interfaces:**
- Consumes: `api`/`useDatos`, `useAuth`, constantes (meses, estados, cargos, tipos, disciplinas, objetivos), `useState`.
- Produce: vista de calendario mensual (grilla), con modal/form para crear y editar eventos usando **exactamente** el formulario de `calendario.php:360-598`, y acciones ejecutar (`POST /api/eventos/:id/ejecutar`) y eliminar (`DELETE /api/eventos/:id`). Réplica del JS actual de `assets/js/calendario.js`.

- [ ] **Step 1: Reescribir `client/src/paginas/Calendario.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  MESES, AREAS_VE, CARGOS_RESPONSABLE, TIPOS_ORGANIZACION, TIPOS_ACTIVIDAD,
  DISCIPLINAS_EVENTO, OBJETIVOS_TRANSFORMADORES, ESTADO_EJECUCION,
} from '../constantes';

const vacio = {
  estado: '', municipio: '', parroquia: '', organizacion: '', tipo_organizacion: 'comuna',
  direccion: '', ubicacion_exacta: '', consejo_comunal: '', nombre_consejo: '', nombre_comuna: '',
  vocero_nombre: '', vocero_cedula: '', vocero_telefono: '',
  responsable_nombre: '', responsable_cedula: '', responsable_telefono: '', responsable_cargo: '',
  tipo_actividad: '', disciplina: '', nombre_actividad: '', objetivo: '',
  mes: '', fecha: '', hora: '', duracion: '',
  ninos: 0, ninas: 0, jovenes_masculinos: 0, jovenes_femeninas: 0, adultos_masculinos: 0, adultos_femeninas: 0,
};

const PARTICIPANTES = [
  ['ninos', 'Niños (1 a 12 años)'],
  ['ninas', 'Niñas (1 a 12 años)'],
  ['jovenes_masculinos', 'Jóvenes masculinos (12 a 17 años)'],
  ['jovenes_femeninas', 'Jóvenes femeninas (12 a 17 años)'],
  ['adultos_masculinos', 'Adultos masculinos (18+)'],
  ['adultos_femeninas', 'Adultas femeninas (18+)'],
];

export default function Calendario() {
  const { usuario } = useAuth();
  const ahora = new Date();
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = async () => {
    try {
      const r = await api(`/api/eventos?mes=${mes}&anio=${anio}`);
      setEventos(r.eventos);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, [mes, anio]);

  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasMes = new Date(anio, mes, 0).getDate();
  const celdas = Array.from({ length: primerDia }, () => null).concat(Array.from({ length: diasMes }, (_, i) => i + 1));
  const porDia = {};
  eventos.forEach((e) => { const d = new Date(e.fecha).getDate(); (porDia[d] = porDia[d] || []).push(e); });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const abrirNuevo = () => {
    setForm({ ...vacio, mes: String(mes) });
    setEditandoId(null);
    setAbierto(true);
  };
  const abrirEdicion = (ev) => {
    const { id, fecha, hora, ...resto } = ev;
    setForm({ ...resto, fecha: fecha.slice(0, 10), hora: hora.slice(0, 5), mes: String(ev.mes) });
    setEditandoId(id);
    setAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = { ...form, mes: Number(form.mes) };
    try {
      if (editandoId) await api(`/api/eventos/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      else await api('/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setAbierto(false);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const ejecutar = async (id) => {
    try { await api(`/api/eventos/${id}/ejecutar`, { method: 'POST' }); cargar(); } catch (err) { setError(err.message); }
  };
  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try { await api(`/api/eventos/${id}`, { method: 'DELETE' }); cargar(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2>Calendario de Actividades</h2>
        <button className="btn" type="button" onClick={abrirNuevo}>Agregar Actividad</button>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={{ width: 90 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--azul)' }}>{d}</div>)}
          {celdas.map((d, i) => (
            <div key={i} style={{ minHeight: 90, border: '1px solid var(--borde)', borderRadius: 6, padding: 6, background: d ? '#fff' : 'transparent' }}>
              {d && (
                <>
                  <strong>{d}</strong>
                  {(porDia[d] || []).map((ev) => (
                    <div key={ev.id} style={{ fontSize: 12, background: 'var(--amarillo)', borderRadius: 4, padding: '2px 4px', marginTop: 4, cursor: 'pointer' }}
                      onClick={() => abrirEdicion(ev)}>
                      {ev.nombre_actividad}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', overflowY: 'auto', zIndex: 50 }}>
          <div className="tarjeta" style={{ maxWidth: 860, margin: '40px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'var(--azul)' }}>{editandoId ? 'Editar Actividad' : 'Nueva Actividad — Misión Cultura'}</h2>
              <button className="btn-bajo" type="button" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
            <form onSubmit={guardar}>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Información General</h3>
                <div className="campo"><label>Correo electrónico</label><input value={usuario?.email} readOnly /></div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Ubicación Geográfica</h3>
                <div className="grilha grilha-2">
                  <div className="campo"><label>Estado *</label>
                    <select value={form.estado} onChange={set('estado')} required>
                      <option value="">Seleccione un estado</option>
                      {AREAS_VE.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select></div>
                  <div className="campo"><label>Municipio *</label><input value={form.municipio} onChange={set('municipio')} required /></div>
                  <div className="campo"><label>Parroquia *</label><input value={form.parroquia} onChange={set('parroquia')} required /></div>
                  <div className="campo"><label>Organización *</label><input value={form.organizacion} onChange={set('organizacion')} required /></div>
                  <div className="campo"><label>Identificar si es comunas o circuito comunal</label>
                    <select value={form.tipo_organizacion} onChange={set('tipo_organizacion')}>
                      {Object.entries(TIPOS_ORGANIZACION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select></div>
                  <div className="campo"><label>Dirección exacta *</label><input value={form.direccion} onChange={set('direccion')} required /></div>
                  <div className="campo"><label>Ubicación exacta del punto y círculo</label><input value={form.ubicacion_exacta} onChange={set('ubicacion_exacta')} /></div>
                  <div className="campo"><label>Consejo comunal vinculado *</label><input value={form.consejo_comunal} onChange={set('consejo_comunal')} required /></div>
                  <div className="campo"><label>Nombre del consejo comunal</label><input value={form.nombre_consejo} onChange={set('nombre_consejo')} /></div>
                  <div className="campo"><label>Nombre de la comuna o circuito comunal *</label><input value={form.nombre_comuna} onChange={set('nombre_comuna')} required /></div>
                </div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Datos del Vocero Responsable de la Comunidad</h3>
                <div className="grilha grilha-3">
                  <div className="campo"><label>Nombre y apellido *</label><input value={form.vocero_nombre} onChange={set('vocero_nombre')} required /></div>
                  <div className="campo"><label>Cédula *</label><input value={form.vocero_cedula} onChange={set('vocero_cedula')} required /></div>
                  <div className="campo"><label>Teléfono *</label><input value={form.vocero_telefono} onChange={set('vocero_telefono')} required /></div>
                </div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Datos del Responsable por Misión Cultura</h3>
                <div className="grilha grilha-2">
                  <div className="campo"><label>Nombre y apellido *</label><input value={form.responsable_nombre} onChange={set('responsable_nombre')} required /></div>
                  <div className="campo"><label>Teléfono *</label><input value={form.responsable_telefono} onChange={set('responsable_telefono')} required /></div>
                  <div className="campo"><label>Cédula *</label><input value={form.responsable_cedula} onChange={set('responsable_cedula')} required /></div>
                  <div className="campo"><label>Cargo *</label>
                    <select value={form.responsable_cargo} onChange={set('responsable_cargo')} required>
                      <option value="">Seleccione un cargo</option>
                      {CARGOS_RESPONSABLE.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select></div>
                </div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Descripción de la Actividad</h3>
                <div className="grilha grilha-2">
                  <div className="campo"><label>Tipo de actividad *</label>
                    <select value={form.tipo_actividad} onChange={set('tipo_actividad')} required>
                      <option value="">Seleccione un tipo de actividad</option>
                      {TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div className="campo"><label>Disciplina *</label>
                    <select value={form.disciplina} onChange={set('disciplina')} required>
                      <option value="">Seleccione una disciplina</option>
                      {DISCIPLINAS_EVENTO.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select></div>
                  <div className="campo"><label>Nombre de la actividad *</label><input value={form.nombre_actividad} onChange={set('nombre_actividad')} required /></div>
                  <div className="campo"><label>Objetivo transformador (contenido) *</label>
                    <select value={form.objetivo} onChange={set('objetivo')} required>
                      <option value="">Seleccione un objetivo transformador</option>
                      {OBJETIVOS_TRANSFORMADORES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select></div>
                </div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Fecha y Hora</h3>
                <div className="grilha grilha-3">
                  <div className="campo"><label>Mes *</label>
                    <select value={form.mes} onChange={set('mes')} required>
                      <option value="">Seleccione</option>
                      {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select></div>
                  <div className="campo"><label>Fecha *</label><input type="date" value={form.fecha} onChange={set('fecha')} required /></div>
                  <div className="campo"><label>Hora *</label><input type="time" value={form.hora} onChange={set('hora')} required /></div>
                  <div className="campo"><label>Duración (horas) *</label><input type="number" min="1" value={form.duracion} onChange={set('duracion')} required /></div>
                </div>
              </section>
              <section>
                <h3 style={{ color: 'var(--rojo)' }}>Datos de Participación (Beneficiarios)</h3>
                <div className="grilha grilha-3">
                  {PARTICIPANTES.map(([k, label]) => (
                    <div className="campo" key={k}><label>{label} *</label><input type="number" min="0" value={form[k]} onChange={set(k)} required /></div>
                  ))}
                </div>
              </section>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <button className="btn" type="submit">{editandoId ? 'Guardar Cambios' : 'Agregar Actividad'}</button>
                {editandoId && (
                  <>
                    <button className="btn btn-sec" type="button" onClick={() => ejecutar(editandoId)}>Marcar como Reportada</button>
                    <button className="btn-bajo" type="button" onClick={() => eliminar(editandoId)}>Eliminar</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar manual**

Desde `/calendario`: crear evento completo → aparece en la grilla del mes; clic en el bloque abre el modal de edición; botón "ejecutar" en la vista no existe aún (se ejecuta desde la tarjeta — verificar creando vía API: `curl -X POST .../api/eventos/:id/ejecutar`) → ver el estado cambiar; eliminar desde el modal.

- [ ] **Step 3: Commit**

```bash
git add client/src/paginas/Calendario.jsx
git commit -m "feat: calendario mensual con CRUD completo de Misión Cultura"
```

---

### Task 16: Cultores (listado con filtros, ficha, alta/edición)

**Files:**
- Modify: `client/src/paginas/Cultores.jsx`

**Interfaces:**
- Consumes: `api`/`useDatos`, `useAuth`, constantes (`AREAS_TEMATICAS`).
- Produce: listado con filtros por área y municipio (`GET /api/cultores` + `/opciones`), tarjetas con ficha, modal de alta/edición (`POST`/`PUT`), eliminación blanda (`DELETE`). Réplica de `cultores.php`.

- [ ] **Step 1: Reescribir `client/src/paginas/Cultores.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import { AREAS_TEMATICAS } from '../constantes';

const vacio = {
  nombres_apellidos: '', telefono: '', cedula: '', correo: '', area_tematica: '',
  disciplina: '', comuna: '', municipio: '', parroquia: '', carnet_patria: '',
  direccion: '', lugar_nacimiento: '', fecha_nacimiento: '', edad: '', trayectoria_anios: 0, organizacion: '',
};

export default function Cultores() {
  const [cultores, setCultores] = useState([]);
  const [opciones, setOpciones] = useState({ areas: [], municipios: [] });
  const [fArea, setFArea] = useState('');
  const [fMun, setFMun] = useState('');
  const [error, setError] = useState(null);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = async () => {
    const q = new URLSearchParams();
    if (fArea) q.set('area_tematica', fArea);
    if (fMun) q.set('municipio', fMun);
    try {
      const r = await api(`/api/cultores?${q.toString()}`);
      setCultores(r.cultores);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { cargar(); }, [fArea, fMun]);
  useEffect(() => {
    api('/api/cultores/opciones').then((r) => setOpciones(r)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const abrirNuevo = () => { setForm(vacio); setEditandoId(null); setAbierto(true); };
  const abrirEdicion = (c) => { const { id, fecha_registro, ...resto } = c; resto.fecha_nacimiento = c.fecha_nacimiento.slice(0, 10); setForm(resto); setEditandoId(id); setAbierto(true); };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editandoId) await api(`/api/cultores/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      else await api('/api/cultores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setAbierto(false);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este cultor?')) return;
    try { await api(`/api/cultores/${id}`, { method: 'DELETE' }); cargar(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2>Cultores</h2>
        <button className="btn" type="button" onClick={abrirNuevo}>Registrar Cultor</button>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="campo" style={{ minWidth: 180 }}>
          <label htmlFor="fArea">Área temática</label>
          <select id="fArea" value={fArea} onChange={(e) => setFArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {opciones.areas.map((a) => <option key={a} value={a}>{AREAS_TEMATICAS[a] || a}</option>)}
          </select>
        </div>
        <div className="campo" style={{ minWidth: 180 }}>
          <label htmlFor="fMun">Municipio</label>
          <select id="fMun" value={fMun} onChange={(e) => setFMun(e.target.value)}>
            <option value="">Todos los municipios</option>
            {opciones.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grilha grilha-3">
        {cultores.map((c) => (
          <div className="tarjeta" key={c.id}>
            <h3 style={{ color: 'var(--azul)', margin: 0, fontSize: 17 }}>{c.nombres_apellidos}</h3>
            <p style={{ color: '#666', fontSize: 13 }}>{AREAS_TEMATICAS[c.area_tematica] || c.area_tematica} — {c.disciplina}</p>
            <p>Cédula: {c.cedula}<br />Correo: {c.correo}<br />Municipio: {c.municipio}, {c.parroquia}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-sec" type="button" onClick={() => abrirEdicion(c)}>Editar</button>
              <button className="btn-bajo" type="button" onClick={() => eliminar(c.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', overflowY: 'auto', zIndex: 50 }}>
          <div className="tarjeta" style={{ maxWidth: 820, margin: '40px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'var(--azul)' }}>{editandoId ? 'Editar Cultor' : 'Registrar Cultor'}</h2>
              <button className="btn-bajo" type="button" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
            <form onSubmit={guardar}>
              <div className="grilha grilha-2">
                <div className="campo"><label>Nombres y apellidos *</label><input value={form.nombres_apellidos} onChange={set('nombres_apellidos')} required /></div>
                <div className="campo"><label>Teléfono *</label><input value={form.telefono} onChange={set('telefono')} required /></div>
                <div className="campo"><label>Cédula *</label><input value={form.cedula} onChange={set('cedula')} required /></div>
                <div className="campo"><label>Correo *</label><input type="email" value={form.correo} onChange={set('correo')} required /></div>
                <div className="campo"><label>Área temática *</label>
                  <select value={form.area_tematica} onChange={set('area_tematica')} required>
                    <option value="">Seleccionar...</option>
                    {Object.entries(AREAS_TEMATICAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div className="campo"><label>Disciplina *</label><input value={form.disciplina} onChange={set('disciplina')} required /></div>
                <div className="campo"><label>Comuna *</label><input value={form.comuna} onChange={set('comuna')} required /></div>
                <div className="campo"><label>Municipio *</label><input value={form.municipio} onChange={set('municipio')} required /></div>
                <div className="campo"><label>Parroquia *</label><input value={form.parroquia} onChange={set('parroquia')} required /></div>
                <div className="campo"><label>Código carnet patria *</label><input value={form.carnet_patria} onChange={set('carnet_patria')} required /></div>
                <div className="campo"><label>Dirección exacta *</label><input value={form.direccion} onChange={set('direccion')} required /></div>
                <div className="campo"><label>Lugar de nacimiento *</label><input value={form.lugar_nacimiento} onChange={set('lugar_nacimiento')} required /></div>
                <div className="campo"><label>Fecha de nacimiento *</label><input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required /></div>
                <div className="campo"><label>Edad *</label><input type="number" min="0" value={form.edad} onChange={set('edad')} required /></div>
                <div className="campo"><label>Años de trayectoria *</label><input type="number" min="0" max="100" value={form.trayectoria_anios} onChange={set('trayectoria_anios')} required /></div>
                <div className="campo"><label>Organización *</label><input value={form.organizacion} onChange={set('organizacion')} required /></div>
              </div>
              <button className="btn" type="submit">{editandoId ? 'Guardar Cambios' : 'Registrar Cultor'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar con cultor seed restaurado**

Run: `npm --workspace server run db:init` (restaura seed si Task 7 borró el cultor) y navegar `/cultores` con admin.
Expected: María González visible; filtros de área/municipio funcionan; alta/edición/borrado operan.

- [ ] **Step 3: Commit**

```bash
git add client/src/paginas/Cultores.jsx
git commit -m "feat: gestión de cultores con filtros y ficha completa"
```

---

### Task 17: Reportes con PDF oficial (membrete tricolor + 8 estrellas)

**Files:**
- Modify: `client/src/paginas/Reportes.jsx`
- Create: `client/src/lib/reportePDF.js`

**Interfaces:**
- Consumes: `api` (`POST /api/reportes`, `GET /api/reportes/filtros`), `jspdf`, `jspdf-autotable`.
- Produce: formulario de reporte (tipo, vista, filtros), tabla de resultados, descarga de PDF con membrete institucional (barra tricolor con estrella en la franja azul, cabecera con nombre del ministerio, título del reporte, filtros aplicados y fecha de generación). Réplica de `reportes.php` (JS PDF + autotable).

- [ ] **Step 1: Crear `client/src/lib/reportePDF.js`**

```js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AMARILLO = [255, 215, 0];
const AZUL = [0, 56, 147];
const ROJO = [207, 20, 43];

export const USUARIO_LABEL = {
  admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo',
  funcionario: 'Funcionario', cultor: 'Cultor', publico: 'Público en general',
};

// Membretación: barra tricolor horizontal con estrellas en la franja azul
const membrete = (doc, titulo, subtitulo) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AMARILLO); doc.rect(0, 0, w, 6, 'F');
  doc.setFillColor(...AZUL); doc.rect(0, 6, w, 6, 'F');
  doc.setFontSize(5); doc.setTextColor(255, 255, 255);
  doc.text('★ ★ ★ ★ ★ ★ ★ ★', 70, 10.5); // 8 estrellas en la franja azul
  doc.setFillColor(...ROJO); doc.rect(0, 12, w, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Ministerio del Poder Popular para la Cultura', w / 2, 26, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('República Bolivariana de Venezuela · Misión Cultura', w / 2, 33, { align: 'center' });
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(titulo, w / 2, 42, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(subtitulo, w / 2, 49, { align: 'center' });
  doc.line(14, 53, w - 14, 53);
};

export default function generarPDF({ titulo, subtitulo, cabecera = [], columnas, filas, resumen, distribuciones }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  membrete(doc, titulo, subtitulo);
  const w = doc.internal.pageSize.getWidth();

  if (cabecera.length) {
    doc.setFontSize(9);
    cabecera.forEach((linea, i) => doc.text(linea, 14, 57 + i * 5));
  }
  let yInicial = 59 + cabecera.length * 5;

  autoTable(doc, {
    startY: yInicial,
    head: [columnas],
    body: filas.map((f) => columnas.map((c) => (f[c] ?? '') === null ? '—' : String(f[c]))),
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: AZUL },
    alternateRowStyles: { fillColor: [242, 245, 250] },
    margin: { top: 60, bottom: 15 },
  });

  let y = doc.lastAutoTable.finalY + 8;
  if (resumen && Object.keys(resumen).length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, y);
    doc.setFont('helvetica', 'normal');
    Object.entries(resumen).forEach(([k, v]) => {
      y += 5;
      doc.text(`${k}: ${v}`, 18, y);
    });
    y += 8;
  }
  if (distribuciones?.cultores_por_area?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Cultores por área temática', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    distribuciones.cultores_por_area.forEach((d) => { doc.text(`${d.area_tematica}: ${d.total}`, 18, y); y += 5; });
    y += 8;
  }
  if (distribuciones?.eventos_por_disciplina?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Eventos por disciplina', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    distribuciones.eventos_por_disciplina.forEach((d) => { doc.text(`${d.disciplina}: ${d.total}`, 18, y); y += 5; });
  }

  const paginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${paginas} · Ministerio del Poder Popular para la Cultura · Realizado por Rodolfo Gómez`, w / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }
  doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
}
```

- [ ] **Step 2: Reescribir `client/src/paginas/Reportes.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import generarPDF from '../lib/reportePDF';

const TIPOS = {
  eventos: 'Eventos',
  cultores: 'Cultores',
  usuarios: 'Usuarios del Sistema',
  actividad_ejecutada: 'Actividades Ejecutadas',
  actividad_reportada: 'Actividades Reportadas',
};

// Columnas de presentación (nombres de columna del modelo)
const EVENTO_COLS = ['id', 'correo_usuario', 'estado', 'municipio', 'parroquia', 'organizacion', 'tipo_organizacion', 'direccion', 'ubicacion_exacta', 'consejo_comunal', 'nombre_consejo', 'nombre_comuna', 'vocero_nombre', 'vocero_cedula', 'responsable_nombre', 'responsable_cargo', 'tipo_actividad', 'disciplina', 'nombre_actividad', 'objetivo', 'mes', 'fecha', 'hora', 'duracion', 'ninos', 'ninas', 'jovenes_masculinos', 'jovenes_femeninas', 'adultos_masculinos', 'adultos_femeninas', 'asistentes'];
const CULTOR_COLS = ['id', 'nombres_apellidos', 'telefono', 'cedula', 'correo', 'area_tematica', 'disciplina', 'comuna', 'municipio', 'parroquia', 'carnet_patria', 'fecha_nacimiento', 'trayectoria_anios', 'organizacion'];
const USUARIO_COLS = ['id', 'nombre_completo', 'email', 'telefono', 'tipo_usuario', 'fecha_registro'];

export default function Reportes() {
  const [tipo, setTipo] = useState('eventos');
  const [vista, setVista] = useState('detallado');
  const [filtros, setFiltros] = useState({ responsable: '', municipio: '', id_evento: '', area_tematica: '', tipo_usuario: '', fecha_desde: '', fecha_hasta: '' });
  const [opciones, setOpciones] = useState({ responsables: [], municipios: [], eventos: [], areas: [], tipos_usuario: [] });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api('/api/reportes/filtros').then(setOpciones).catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });

  const columnas = tipo === 'cultores' ? CULTOR_COLS : tipo === 'usuarios' ? USUARIO_COLS : EVENTO_COLS;

  const consultar = async () => {
    setError(null); setCargando(true);
    try {
      const payload = { tipo, vista, ...filtros };
      if (!['eventos', 'actividad_ejecutada', 'actividad_reportada'].includes(tipo)) delete payload.responsable;
      const r = await api('/api/reportes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setResultado(r);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  const descargarPDF = async () => {
    const payload = { tipo, vista: 'detallado', ...filtros };
    const r = await api('/api/reportes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const subtitulo = [
      `Tipo: ${TIPOS[tipo]}`,
      ...(filtros.municipio ? [`Municipio: ${filtros.municipio}`] : []),
      ...(filtros.responsable ? [`Responsable: ${filtros.responsable}`] : []),
      ...(filtros.fecha_desde ? [`Desde: ${filtros.fecha_desde}`] : []),
      ...(filtros.fecha_hasta ? [`Hasta: ${filtros.fecha_hasta}`] : []),
    ].join(' · ');
    generarPDF({
      titulo: TIPOS[tipo],
      subtitulo,
      cabecera: [`Generado el ${new Date().toLocaleString('es-VE')} por el sistema de reportes`],
      columnas: columnas.map((c) => c.replace(/_/g, ' ').toUpperCase()),
      filas: r.filas,
      resumen: r.vista === 'general' ? r.resumen : {},
      distribuciones: r.distribuciones,
    });
  };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2>Reportes</h2>
        <button className="btn" type="button" onClick={descargarPDF}>Descargar PDF</button>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <div className="grilha grilha-2">
          <div className="campo">
            <label htmlFor="tipo">Tipo de reporte</label>
            <select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setResultado(null); }}>
              {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="vista">Vista</label>
            <select id="vista" value={vista} onChange={(e) => setVista(e.target.value)}>
              <option value="general">General (resumen)</option>
              <option value="detallado">Detallado</option>
            </select>
          </div>
          {(tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') && (
            <>
              <div className="campo">
                <label htmlFor="responsable">Responsable</label>
                <select id="responsable" value={filtros.responsable} onChange={set('responsable')}>
                  <option value="">Todos</option>
                  {opciones.responsables.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="municipio">Municipio</label>
                <select id="municipio" value={filtros.municipio} onChange={set('municipio')}>
                  <option value="">Todos</option>
                  {opciones.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="id_evento">Evento</label>
                <select id="id_evento" value={filtros.id_evento} onChange={set('id_evento')}>
                  <option value="">Todos</option>
                  {opciones.eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre_actividad}</option>)}
                </select>
              </div>
            </>
          )}
          {tipo === 'cultores' && (
            <div className="campo">
              <label htmlFor="area_tematica">Área temática</label>
              <select id="area_tematica" value={filtros.area_tematica} onChange={set('area_tematica')}>
                <option value="">Todas</option>
                {opciones.areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          {tipo === 'usuarios' && (
            <div className="campo">
              <label htmlFor="tipo_usuario">Tipo de usuario</label>
              <select id="tipo_usuario" value={filtros.tipo_usuario} onChange={set('tipo_usuario')}>
                <option value="">Todos</option>
                {opciones.tipos_usuario.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="campo"><label htmlFor="fecha_desde">Desde</label><input id="fecha_desde" type="date" value={filtros.fecha_desde} onChange={set('fecha_desde')} /></div>
          <div className="campo"><label htmlFor="fecha_hasta">Hasta</label><input id="fecha_hasta" type="date" value={filtros.fecha_hasta} onChange={set('fecha_hasta')} /></div>
        </div>
        <button className="btn btn-sec" type="button" onClick={consultar} disabled={cargando}>{cargando ? 'Generando…' : 'Generar Reporte'}</button>
      </div>

      {resultado && (
        <div className="tarjeta" style={{ overflowX: 'auto' }}>
          {resultado.vista === 'general' ? (
            <p><strong>Total:</strong> {resultado.resumen.total ?? resultado.filas.length}{resultado.resumen.asistentes != null ? ` · Asistentes: ${resultado.resumen.asistentes}` : ''}</p>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
              <thead>
                <tr>{columnas.map((c) => <th key={c} style={{ border: '1px solid #ccc', padding: 6, background: 'var(--azul)', color: '#fff', textTransform: 'uppercase' }}>{c.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {resultado.filas.map((f, i) => (
                  <tr key={i}>{columnas.map((c) => <td key={c} style={{ border: '1px solid #ccc', padding: 6 }}>{f[c] ?? '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar manual**

Navegar `/reportes` con admin: generar "Eventos" detallado (tabla), descargar PDF (archivo con membrete tricolor, 8 estrellas, autotable legible, pie de página). Probar "usuarios", "actividad_reportada", filtro por estado.

Run: `npm --workspace client run build`
Expected: build exitoso (jspdf/autotable importados correctamente).

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/reportePDF.js client/src/paginas/Reportes.jsx
git commit -m "feat: reportes con filtros y descarga PDF institucional"
```

---

### Task 18: Crear Usuario (jerarquía por rol)

**Files:**
- Modify: `client/src/paginas/CrearUsuario.jsx`

**Interfaces:**
- Consumes: `api`, `useAuth()`, `TIPOS_USUARIO` (constantes.js).
- Produce: formulario (nombre, correo, teléfono, tipo, contraseña mín. 6) → `POST /api/usuarios`. Ruta `/crear-usuario` ya protegida en `main.jsx` para `admin|director_general|director_operativo`. El select de tipos refleja la jerarquía del rol actual:
  - `admin`: todos los staff.
  - `director_general`: `director_operativo`, `funcionario`.
  - `director_operativo`: `funcionario`.

- [ ] **Step 1: Reescribir `client/src/paginas/CrearUsuario.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const JERARQUIA = {
  admin: ['admin', 'director_general', 'director_operativo', 'funcionario'],
  director_general: ['director_operativo', 'funcionario'],
  director_operativo: ['funcionario'],
};

const LABEL = { admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo', funcionario: 'Funcionario' };

const vacio = { nombre_completo: '', email: '', telefono: '', tipo_usuario: '', password: '', confirm_password: '' };

export default function CrearUsuario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);
  const [cargando, setCargando] = useState(false);

  const rolesPermitidos = JERARQUIA[usuario?.tipo] || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    try {
      const { confirm_password, ...payload } = form;
      await api('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setOk(`Usuario ${form.nombre_completo} (${LABEL[form.tipo_usuario]}) creado correctamente.`);
      setForm(vacio);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  return (
    <div className="contenedor" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="tarjeta">
        <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>Crear Nuevo Usuario</h2>
        <p style={{ color: '#555', fontSize: 14 }}>
          Puede crear usuarios de los siguientes tipos: {rolesPermitidos.map((r) => LABEL[r]).join(', ')}.
        </p>
        {error && <div className="aviso aviso-error">{error}</div>}
        {ok && <div className="aviso aviso-ok">{ok}</div>}
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="nombre_completo">Nombre completo *</label>
            <input id="nombre_completo" value={form.nombre_completo} onChange={set('nombre_completo')} required />
          </div>
          <div className="campo">
            <label htmlFor="email">Correo electrónico *</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="campo">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="tel" value={form.telefono} onChange={set('telefono')} />
          </div>
          <div className="campo">
            <label htmlFor="tipo_usuario">Tipo de usuario *</label>
            <select id="tipo_usuario" value={form.tipo_usuario} onChange={set('tipo_usuario')} required>
              <option value="">Seleccionar tipo de usuario</option>
              {rolesPermitidos.map((r) => <option key={r} value={r}>{LABEL[r]}</option>)}
            </select>
          </div>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="password">Contraseña *</label>
              <input id="password" type="password" minLength={6} value={form.password} onChange={set('password')} required />
            </div>
            <div className="campo">
              <label htmlFor="confirm_password">Confirmar contraseña *</label>
              <input id="confirm_password" type="password" minLength={6} value={form.confirm_password} onChange={set('confirm_password')} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Creando…' : 'Crear Usuario'}</button>
            <button className="btn-sec" type="button" onClick={() => navigate('/panel')}>Volver al Panel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar con admin** — crear un `funcionario`; probar que el select como `director_operativo` no lista `admin` (sesión distinta).

- [ ] **Step 3: Commit**

```bash
git add client/src/paginas/CrearUsuario.jsx
git commit -m "feat: creación de usuarios con jerarquía por rol"
```

---

### Task 19: Foro (feed, crear/editar/borrar, likes, comentarios, media)

**Files:**
- Create: `client/src/componentes/MediaArchivo.jsx`
- Modify: `client/src/paginas/Foro.jsx`

**Interfaces:**
- Consumes: `api`, `useAuth()`, `useDatos`/`useEffect`, constantes (`CATEGORIAS_FORO`).
- Produce: feed (`GET /api/foro`) con tarjetas, contadores de likes/comentarios, botón like toggle (`POST /api/foro/publicaciones/:id/like`), formulario de nueva publicación (`POST /api/foro/publicaciones` con `FormData` y archivo opcional), editar/eliminar solo el autor (PUT/DELETE), y comentarios (GET/POST). Réplica de `foro.php`.

- [ ] **Step 1: Crear `client/src/componentes/MediaArchivo.jsx`**

```jsx
export default function MediaArchivo({ publicacion }) {
  if (!publicacion.archivo_url) return null;
  if (publicacion.tipo_archivo === 'imagen') {
    return <img src={publicacion.archivo_url} alt={publicacion.titulo} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 10 }} />;
  }
  if (publicacion.tipo_archivo === 'video') {
    return <video src={publicacion.archivo_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginTop: 10 }} />;
  }
  if (publicacion.tipo_archivo === 'audio') {
    return <audio src={publicacion.archivo_url} controls style={{ width: '100%', marginTop: 10 }} />;
  }
  return null;
}
```

- [ ] **Step 2: Reescribir `client/src/paginas/Foro.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

const nuevoVacio = { titulo: '', categoria: 'musica', descripcion: '', archivo: null };

export default function Foro() {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [error, setError] = useState(null);
  const [nueva, setNueva] = useState(nuevoVacio);
  const [editando, setEditando] = useState(null);
  const [comentariosDe, setComentariosDe] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState('');

  const cargar = async () => {
    try {
      const r = await api('/api/foro');
      setPublicaciones(r.publicaciones);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirComentarios = async (id) => {
    setComentariosDe(id);
    const r = await api(`/api/foro/publicaciones/${id}/comentarios`);
    setComentarios(r.comentarios);
  };

  const crearPublicacion = async (e) => {
    e.preventDefault();
    if (!usuario) { setError('Debes iniciar sesión para publicar'); return; }
    const fd = new FormData();
    fd.append('titulo', nueva.titulo);
    fd.append('categoria', nueva.categoria);
    fd.append('descripcion', nueva.descripcion);
    if (nueva.archivo) fd.append('archivo', nueva.archivo);
    try {
      await api('/api/foro/publicaciones', { method: 'POST', body: fd });
      setNueva(nuevoVacio);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titulo', editando.titulo);
    fd.append('categoria', editando.categoria);
    fd.append('descripcion', editando.descripcion);
    if (editando.archivo) fd.append('archivo', editando.archivo);
    await api(`/api/foro/publicaciones/${editando.id}`, { method: 'PUT', body: fd });
    setEditando(null);
    cargar();
  };

  const toggleLike = async (p) => {
    if (!usuario) { setError('Debes iniciar sesión para dar like'); return; }
    try {
      const r = await api(`/api/foro/publicaciones/${p.id}/like`, { method: 'POST' });
      setPublicaciones((prev) => prev.map((x) =>
        x.id === p.id
          ? { ...x, mio_like: r.liked, likes_count: x.likes_count + (r.liked ? 1 : -1) }
          : x
      ));
    } catch (err) { setError(err.message); }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api(`/api/foro/publicaciones/${id}`, { method: 'DELETE' });
      if (comentariosDe === id) setComentariosDe(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!usuario) { setError('Debes iniciar sesión para comentar'); return; }
    await api(`/api/foro/publicaciones/${comentariosDe}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: textoComentario }),
    });
    setTextoComentario('');
    abrirComentarios(comentariosDe);
  };

  return (
    <div className="contenedor">
      <h2>Foro Comunitario Cultural</h2>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Nueva publicación</h3>
        <form onSubmit={crearPublicacion}>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="titulo">Título *</label>
              <input id="titulo" value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="categoria">Categoría *</label>
              <select id="categoria" value={nueva.categoria} onChange={(e) => setNueva({ ...nueva, categoria: e.target.value })}>
                {Object.entries(CATEGORIAS_FORO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="campo">
            <label htmlFor="descripcion">Descripción *</label>
            <textarea id="descripcion" rows="4" value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} required />
          </div>
          <div className="campo">
            <label htmlFor="archivo">Adjuntar imagen, video o audio (opcional, máx. 5 MB)</label>
            <input id="archivo" type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setNueva({ ...nueva, archivo: e.target.files[0] || null })} />
          </div>
          <button className="btn" type="submit" disabled={!usuario}>Publicar</button>
        </form>
      </div>

      {publicaciones.map((p) => (
        <article className="tarjeta" key={p.id} style={{ borderLeft: `4px solid ${p.mio_like ? 'var(--amarillo)' : 'var(--azul)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: 'var(--azul)' }}>{p.titulo}</h3>
            <span style={{ background: 'var(--amarillo)', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
          </div>
          <p style={{ color: '#666', fontSize: 13 }}>
            por <strong>{p.autor_nombre}</strong> · {new Date(p.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}
          </p>
          <p>{p.descripcion}</p>
          <MediaArchivo publicacion={p} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button className="btn-sec" type="button" onClick={() => toggleLike(p)} style={{ padding: '4px 10px', fontSize: 13 }}>
              {p.mio_like ? '♥' : '♡'} {p.likes_count}
            </button>
            <button className="btn-bajo" type="button" onClick={() => abrirComentarios(p.id)} style={{ padding: '4px 10px', fontSize: 13 }}>
              Comentarios ({p.comments_count})
            </button>
            {usuario?.id === p.usuario_id && (
              <>
                <button className="btn-bajo" type="button" onClick={() => setEditando({ ...p, archivo: null })}>Editar</button>
                <button className="btn-bajo" type="button" onClick={() => borrar(p.id)}>Eliminar</button>
              </>
            )}
          </div>

          {editando?.id === p.id && (
            <form onSubmit={guardarEdicion} style={{ marginTop: 14, borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
              <div className="campo"><label>Título</label><input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} required /></div>
              <div className="campo">
                <label>Categoría</label>
                <select value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
                  {Object.entries(CATEGORIAS_FORO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="campo"><label>Descripción</label><textarea rows="4" value={editando.descripcion} onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} required /></div>
              <div className="campo"><label>Nuevo archivo (opcional)</label><input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setEditando({ ...editando, archivo: e.target.files[0] || null })} /></div>
              <button className="btn" type="submit">Guardar</button>{' '}
              <button className="btn-bajo" type="button" onClick={() => setEditando(null)}>Cancelar</button>
            </form>
          )}

          {comentariosDe === p.id && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
              {comentarios.map((c) => (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <strong>{c.autor_nombre}</strong>: {c.comentario}
                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(c.fecha_comentario).toLocaleString('es-VE')}</div>
                </div>
              ))}
              <form onSubmit={enviarComentario} style={{ display: 'flex', gap: 8 }}>
                <input value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Escribe un comentario…" required />
                <button className="btn" type="submit" disabled={!usuario}>Comentar</button>
              </form>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verificar manual** — con una sesión nueva: publicar (sin archivo y con una imagen), dar like/deslike, comentar; con el autor: editar y eliminar; sin sesión: feed visible pero like/publicar/comentar piden login.

Run: `npm --workspace client run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add client/src/componentes/MediaArchivo.jsx client/src/paginas/Foro.jsx
git commit -m "feat: foro comunitario con likes, comentarios y media"
```

---

### Task 20: Perfil (público + edición de nombre/teléfono)

**Files:**
- Modify: `client/src/paginas/Perfil.jsx`

**Interfaces:**
- Consumes: `useDatos('/api/usuarios/:id')`, `useAuth()`, constantes (`AREAS_TEMATICAS`), componente `MediaArchivo`.
- Produce: tarjeta con datos públicos del usuario (y ficha de cultor si aplica), stats (publicaciones, comentarios, likes recibidos), listado de sus publicaciones con contadores y media, y —si es el perfil propio— formulario de edición de nombre y teléfono (`PUT /api/usuarios/me`). Réplica de `perfil.php`.

- [ ] **Step 1: Reescribir `client/src/paginas/Perfil.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { AREAS_TEMATICAS, CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

export default function Perfil() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos, error } = useDatos(`/api/usuarios/${id}`);
  const [form, setForm] = useState({ nombre_completo: '', telefono: '' });
  const [editando, setEditando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [errEdit, setErrEdit] = useState(null);

  useEffect(() => {
    if (datos) {
      setForm({
        nombre_completo: datos.usuario.nombre_completo || '',
        telefono: datos.usuario.telefono || '',
      });
    }
  }, [datos]);

  const esPropio = usuario?.id === Number(id);

  const guardar = async (e) => {
    e.preventDefault();
    setErrEdit(null);
    setMsg(null);
    try {
      const r = await api('/api/usuarios/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ nombre_completo: r.usuario.nombre_completo, telefono: r.usuario.telefono || '' });
      setEditando(false);
      setMsg('Datos actualizados.');
    } catch (err) { setErrEdit(err.message); }
  };

  if (error) return <div className="contenedor"><div className="aviso aviso-error">{error}</div></div>;
  if (!datos) return <div className="contenedor">Cargando perfil…</div>;

  const { usuario: u, cultor, publicaciones = [], stats = {} } = datos;

  return (
    <div className="contenedor" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="tarjeta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>{u.nombre_completo}</h2>
          {esPropio && (
            <button className="btn-sec" type="button" onClick={() => setEditando(!editando)}>
              {editando ? 'Cancelar' : 'Editar mis datos'}
            </button>
          )}
        </div>
        <p>Correo: {u.email} · Teléfono: {u.telefono || '—'} · Rol: {u.tipo_usuario}</p>
        {cultor && (
          <div style={{ background: '#faf8f0', border: '1px solid var(--borde)', borderRadius: 6, padding: 12 }}>
            <h3 style={{ marginTop: 0, color: 'var(--rojo)' }}>Ficha de Cultor</h3>
            <p>
              Cédula: {cultor.cedula} · {AREAS_TEMATICAS[cultor.area_tematica] || cultor.area_tematica} — {cultor.disciplina}<br />
              Comuna: {cultor.comuna} · Municipio: {cultor.municipio}, {cultor.parroquia}<br />
              Trayectoria: {cultor.trayectoria_anios} años · Organización: {cultor.organizacion || '—'}
            </p>
          </div>
        )}
        {esPropio && editando && (
          <form onSubmit={guardar} style={{ marginTop: 12 }}>
            {msg && <div className="aviso aviso-ok">{msg}</div>}
            {errEdit && <div className="aviso aviso-error">{errEdit}</div>}
            <div className="grilha grilha-2">
              <div className="campo"><label htmlFor="nombre_completo">Nombre completo</label><input id="nombre_completo" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required /></div>
              <div className="campo"><label htmlFor="telefono">Teléfono</label><input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            </div>
            <button className="btn" type="submit">Guardar cambios</button>
          </form>
        )}
      </div>

      <div className="grilha grilha-3">
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.publicaciones ?? publicaciones.length}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Publicaciones</div></div>
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.comentarios ?? 0}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Comentarios</div></div>
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.likes_recibidos ?? 0}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Likes recibidos</div></div>
      </div>

      <h3>Publicaciones de {u.nombre_completo}</h3>
      {publicaciones.map((p) => (
        <article className="tarjeta" key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, color: 'var(--azul)' }}>{p.titulo}</h4>
            <span style={{ background: 'var(--amarillo)', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
          </div>
          <p>{p.descripcion}</p>
          <MediaArchivo publicacion={p} />
          <p style={{ color: '#888', fontSize: 12 }}>♥ {p.likes_count} · 💬 {p.comments_count} · {new Date(p.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar manual** — ver `/perfil/1` (admin, es propio: edición visible), y `/perfil/2` (registrado público: vista solo lectura). Editar nombre y telefonarse; recargar y confirmar persistencia.

- [ ] **Step 3: Commit**

```bash
git add client/src/paginas/Perfil.jsx
git commit -m "feat: perfil público con ficha de cultor, stats y edición propia"
```

---

### Task 21: Integración, smoke test y README

**Files:**
- Create: `scripts/smoke-test.sh`
- Modify: `README.md` (crear si no existe)

**Interfaces:**
- Consumes: servidor completo (Tasks 1-20) y base inicializada.
- Produce: script de humo repetible que comprueba login, dashboard, eventos, cultores, foro público, noticias, reportes y logout; documento README con arranque y credenciales.

- [ ] **Step 1: Crear `scripts/smoke-test.sh`**

```bash
#!/usr/bin/env bash
# Smoke test del sistema Ministerio de Cultura (requiere server corriendo y db:init)
set -euo pipefail
BASE=http://localhost:4000
JAR=/tmp/mc-smoke-cookies.txt
rm -f "$JAR"

log() { printf '%-18s ' "$1"; }

log "health"
[ "$(curl -s "$BASE/api/health")" = '{"ok":true}' ] && echo OK || { echo FAIL; exit 1; }

log "login admin"
curl -s -c "$JAR" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@mincultura.gob.ve","password":"Admin.2026!"}' | grep -q '"tipo":"admin"' && echo OK || { echo FAIL; exit 1; }

log "dashboard"
curl -s -b "$JAR" "$BASE/api/dashboard" | grep -q '"proximosEventos"' && echo OK || { echo FAIL; exit 1; }

log "eventos (mes)"
curl -s -b "$JAR" "$BASE/api/eventos?mes=10&anio=2026" | grep -q '"eventos"' && echo OK || { echo FAIL; exit 1; }

log "cultores"
curl -s -b "$JAR" "$BASE/api/cultores" | grep -q 'María González' && echo OK || { echo FAIL; exit 1; }

log "crear evento"
curl -s -b "$JAR" -X POST "$BASE/api/eventos" -H 'Content-Type: application/json' \
  -d '{"estado":"Miranda","municipio":"Sucre","parroquia":"Petare","organizacion":"Casa","tipo_organizacion":"comuna","direccion":"Av 1","ubicacion_exacta":"Plaza","consejo_comunal":"CC A","nombre_consejo":"CC A","nombre_comuna":"Comuna B","vocero_nombre":"P R","vocero_cedula":"V-1","vocero_telefono":"11","responsable_nombre":"L M","responsable_cedula":"V-2","responsable_telefono":"22","responsable_cargo":"Tutor","tipo_actividad":"taller o conversatorio","disciplina":"teatro","nombre_actividad":"Taller smoke","objetivo":"POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR","mes":11,"fecha":"2026-11-05","hora":"15:00:00","duracion":2,"ninos":1,"ninas":1,"jovenes_masculinos":1,"jovenes_femeninas":1,"adultos_masculinos":1,"adultos_femeninas":1}' \
  | grep -q '"id"' && echo OK || { echo FAIL; exit 1; }

log "foro publico"
curl -s "$BASE/api/foro" | grep -q '"publicaciones"' && echo OK || { echo FAIL; exit 1; }

log "noticias"
curl -s "$BASE/api/noticias" | grep -q 'Gran concierto' && echo OK || { echo FAIL; exit 1; }

log "reportes"
curl -s -b "$JAR" -X POST "$BASE/api/reportes" -H 'Content-Type: application/json' \
  -d '{"tipo":"usuarios","vista":"general"}' | grep -q '"resumen"' && echo OK || { echo FAIL; exit 1; }

log "logout"
curl -s -b "$JAR" -X POST "$BASE/api/auth/logout" | grep -q '"ok":true' && echo OK || { echo FAIL; exit 1; }

log "me sin sesion"
[ "$(curl -s "$BASE/api/auth/me")" = '{"error":"No autenticado"}' ] && echo OK || { echo FAIL; exit 1; }

echo "SMOKE TEST OK"
```

- [ ] **Step 2: Crear `README.md` (reemplazar el existente)** — documentar stack nuevo, arranque, credenciales y mapa de rutas.

```markdown
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
```

- [ ] **Step 3: Ejecutar el smoke test completo (integración)**

Run: `docker compose up -d db && sleep 4 && npm --workspace server run db:init`
Run: (server ya levantado) `bash scripts/smoke-test.sh`
Expected: `SMOKE TEST OK` (las 11 comprobaciones individuales en OK).

Run: `npm --workspace client run build`
Expected: build Vite exitoso (salida `✓` + `dist/`).

- [ ] **Step 4: Repaso de paridad con el original (campo por campo)**

Verificar con la lista de fuentes de verdad del encabezado del plan:

```bash
grep -c "objetivo" server/src/sql/schema.sql   # columna presente
grep -c "OBJETIVOS_TRANSFORMADORES" client/src/constantes.js   # 13 opciones
grep -rl "Cumpleaños viva Venezuela" server/src/validadores.js client/src/constantes.js
```

Comprobar manualmente en el navegador que los formularios de
`registro.php`, `calendario.php`, `crear_usuario.php`, `cultores.php`,
`reportes.php` y el flujo de `foro.php`/`perfil.php` están completos en
sus equivalentes React (tasks 12-20) sin campos perdidos.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-test.sh README.md
git commit -m "docs: README y smoke test de integración del sistema"
```

- [ ] **Step 6: Revisión final**

Run: `git status --short && git log --oneline -15`
Expected: no hay archivos no rastreados relevantes (`node_modules/`,
`server/uploads/*`, `.env`, `dist/` ignorados) y el historial muestra los
commits por tarea 1-21.
