# Rediseño completo — Ministerio del Poder Popular para la Cultura

Fecha: 2026-09-23
Estado: aprobado por el usuario

## Objetivo

Reconstruir el sistema del Ministerio del Poder Popular para la Cultura sobre
un stack moderno (Express + React SPA + PostgreSQL), con un diseño visual al
estilo de las páginas oficiales del Gobierno Bolivariano de Venezuela, sin
perder **ninguno** de los datos, formularios o funcionalidades actuales.

## Decisiones de stack

- **Backend:** Node.js + Express, conexión directa a PostgreSQL con
  `node-postgres` (`pg`). Sin ORM.
- **Frontend:** React (Vite) + React Router. Sin librerías de UI; estilos de
  identidad institucional en CSS propio.
- **Auth:** JWT en cookie `httpOnly` + `SameSite=Strict`, contraseñas con
  `bcryptjs`, CSRF mitigado por cookie + política de mismo sitio.
- **Archivos:** `multer` → `server/uploads`, servidos estáticamente, con
  validación de MIME real y extensión, tamaño máx. 5 MB.
- **PDF de reportes:** `jspdf` + `jspdf-autotable` (lado cliente), con
  membrete tricolor (amarillo/azul/rojo y 8 estrellas en la franja azul).
- **Base de datos:** PostgreSQL 16 en `docker-compose.yml`.
- **Recetas npm:** `server`, `client`, `db:init` (aplica `schema.sql` +
  seed), `setup` (instala todo).

## Arquitectura (monorepo)

```
/ (raíz del repo existente)
├── docker-compose.yml          # postgres:16
├── package.json                # workspaces npm (server, client)
├── server/
│   ├── .env.example
│   ├── src/
│   │   ├── index.js            # bootstrap Express
│   │   ├── db.js               # pool pg + queries
│   │   ├── auth.js             # middleware JWT/roles
│   │   ├── validadores.js      # validación de formularios
│   │   ├── rutas/
│   │   │   ├── auth.js         # registro/login/logout/me
│   │   │   ├── dashboard.js    # stats por rol
│   │   │   ├── eventos.js      # CRUD + ejecutar
│   │   │   ├── cultores.js     # CRUD + filtros
│   │   │   ├── foro.js         # posts/likes/comentarios/uploads
│   │   │   ├── noticias.js     # públicas
│   │   │   ├── usuarios.js     # crear por jerarquía + perfil
│   │   │   └── reportes.js     # datos filtrados para reportes
│   │   └── sql/
│   │       ├── schema.sql      # esquema PostgreSQL (réplica fiel)
│   │       └── seed.sql        # datos de ejemplo equivalentes
│   └── uploads/                # archivos subidos (gitignore)
└── client/
    ├── vite.config.js          # proxy /api -> server
    └── src/
        ├── main.jsx            # React Router
        ├── api.js              # cliente fetch con cookies
        ├── context/AuthContext.jsx
        ├── componentes/        # header institucional, footer, bandera, UI
        ├── paginas/
        │   ├── Inicio.jsx
        │   ├── MisionVision.jsx
        │   ├── MarcoLegal.jsx
        │   ├── Transparencia.jsx
        │   ├── Contacto.jsx
        │   ├── Login.jsx
        │   ├── Registro.jsx
        │   ├── Panel.jsx
        │   ├── Calendario.jsx
        │   ├── Cultores.jsx
        │   ├── Reportes.jsx
        │   ├── CrearUsuario.jsx
        │   ├── Foro.jsx
        │   └── Perfil.jsx
        └── estilos/            # css institucional compartido
```

## Base de datos (PostgreSQL)

Réplica exacta del esquema Firebird actual. Cada tabla conserva los mismos
nombres de columnas (salvo cambios técnicos como tipos `SERIAL`/`BIGINT`,
`TEXT` para BLOB SUB_TYPE TEXT, `BOOLEAN` no usado — se mantiene
`SMALLINT activo` para compatibilidad de datos), valores permitidos y
relaciones. El `.FDB` no es legible en este equipo, por lo que `seed.sql`
recrea los datos de ejemplo equivalentes a `database.sql:150-186`.

Tablas:

1. **usuarios** — nombre_completo, email (UNIQUE), telefono, tipo_usuario
   (`admin|director_general|director_operativo|funcionario|cultor|publico`),
   password_hash, fecha_registro, activo.
2. **cultores** — nombres_apellidos, telefono, cedula (UNIQUE), correo
   (UNIQUE), area_tematica (`musica|danza|teatro|artesPlasticas|literatura|
   artesanias|cine|fotografia`), disciplina, comuna, municipio, parroquia,
   carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad,
   trayectoria_anios, organizacion, fecha_registro, activo.
3. **eventos** — correo_usuario, estado, municipio, parroquia, organizacion,
   tipo_organizacion (`comuna|circuito`), direccion, ubicacion_exacta,
   consejo_comunal, nombre_consejo, nombre_comuna, vocero_nombre/cedula/
   telefono, responsable_nombre/cedula/telefono/cargo (`Animador|Coordinador|
   Facilitador|Tutor`), tipo_actividad, disciplina, nombre_actividad, objetivo,
   mes, fecha, hora, duracion, ninos, ninas, jovenes_masculinos,
   jovenes_femeninas, adultos_masculinos, adultos_femeninas, fecha_creacion,
   estado_ejecucion (`registrado|ejecutado|reportada`), activo.
4. **foro_publicaciones** — usuario_id, titulo, categoria (`danza|musica|
   artesPlasticas|poesia|teatro|cine|fotografia|artesanias`), descripcion
   (TEXT), archivo_url, tipo_archivo (`imagen|video|audio`),
   fecha_publicacion, activo.
5. **foro_comentarios** — publicacion_id, usuario_id, comentario (TEXT),
   fecha_comentario, activo.
6. **foro_likes** — publicacion_id, usuario_id, UNIQUE(publicacion_id,
   usuario_id), fecha_like.
7. **noticias** — titulo, contenido (TEXT), imagen_url, fecha_publicacion,
   autor_id.

Índices: mismos de `database.sql` (email, tipo_usuario, cedula, correo,
area_tematica, municipio, fecha, mes, disciplina, estado, categoria,
fecha_publicacion y FK de likes/comentarios).

## Comportamiento y endpoints por módulo

### Auth y roles
- `POST /api/auth/registro` — contraseña ≥ 8, email único. La cookie
  `httpOnly + SameSite=Strict` mitiga CSRF (sin tokens por formulario). Si
  `tipo_usuario=cultor`, exige y guarda la ficha completa del
  cultor en `usuarios` + `cultores` (edad calculada desde fecha de nacimiento).
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`.
- Redirección post-login: `funcionario/admin/director_*` → Panel; resto → Foro.
- Los 3 roles de dirección pueden crear usuarios (`POST /api/usuarios`) con
  jerarquía: `admin` crea todo; `director_general` crea director_operativo y
  funcionario; `director_operativo` crea funcionario.
- `funcionario`, `admin` y `directores` acceden a: Panel, Calendario,
  Cultores, Reportes. `admin/directores` además a Crear Usuario.
- `cultor` y `publico`: Foro + Perfil.

### Dashboard (Panel)
- Stats según rol (eventos, cultores, publicaciones para staff; publicaciones
  y comentarios propios + total de eventos para cultor) y próximos 5 eventos.

### Calendario
- `GET /api/eventos?mes&anio` — eventos del mes.
- CRUD completo con **el formulario Misión Cultura exacto** (ubicación
  geográfica, vocero responsable, responsable por Misión Cultura con cargo,
  descripción de la actividad con tipo/disciplina/nombre/objetivo
  transformador —las 13 opciones actuales—, fecha/hora/mes/duración y
  participación por rango de edad y sexo).
- `POST /api/eventos/:id/ejecutar` — `estado_ejecucion` → `reportada`.
- Eliminación blanda (`activo=0`). Validación de permisos por rol y del
  `correo_usuario` para borrar eventos propios.

### Cultores
- `GET /api/cultores?area_tematica&municipio` con filtros, listado de áreas y
  municipios para los selects.
- `POST` / `PUT /:id` / `DELETE /:id` (blando). Ficha completa.

### Foro
- Feed público con likes/comentarios; `POST /api/foro/publicaciones`
  (multipart, archivo opcional validado), editar y eliminar solo el autor.
- `POST /api/foro/publicaciones/:id/like` (toggle con UNIQUE).
- `GET/POST /api/foro/publicaciones/:id/comentarios`.
- Media server: `/uploads/*` estático; render según `tipo_archivo`.

### Noticias
- `GET /api/noticias?limite=3` públicas ordenadas por fecha (portada);
  las de ejemplo vienen del seed.

### Reportes
- `GET /api/reportes` con parámetros `tipo` (eventos|cultores|usuarios|
  actividad_ejecutada|actividad_reportada), `vista` (general|detallado) y
  filtros (responsable, municipio, id_evento, area_tematica, tipo_usuario,
  fecha_desde/hasta). SQL parametrizado.
- Vista general = resumen por conteos; vista detallada = filas completas con
  las mismas columnas que la tabla actual (asistentes = suma de los 6 rangos).
- `actividad_ejecutada` / `actividad_reportada` filtran por `estado_ejecucion`.
- Distribuciones: cultores por área temática y eventos por disciplina.
- PDF en el cliente con membrete oficial tricolor + 8 estrellas (replica la
  lógica actual de `reportes.php`).

### Perfil
- `GET /api/usuarios/:id` — datos públicos, publicaciones con counts, stats;
  incluye ficha de cultor si aplica.
- `PUT /api/usuarios/me` — nombre y teléfono.

## Diseño visual

Estilo oficial del Gobierno Bolivariano de Venezuela:
- Barra superior tricolor (amarillo #FFD700, azul #003893, rojo #CF142B) con
  8 estrellas blancas en la franja azul.
- Cabecera institucional: logo + "República Bolivariana de Venezuela" +
  "Ministerio del Poder Popular para la Cultura"; navegación superior con
  hamburguesa móvil.
- Tipografías serif para titulares (Georgia), sans para cuerpo, acentos en
  azul/rojo, botones de acción rojos, tarjetas blancas con sombra.
- Pie de página institucional con enlaces, dirección (Av. Panteón, Foro
  Libertador, Caracas) y "Realizado por Rodolfo Gómez".
- Diseño responsivo a 4 anchos; accesibilidad básica (etiquetas, foco,
  contraste, alt).

## Contenido público nuevo

Páginas reales (contenido institucional sintético y fiel al marco venezolano):
- **Misión y Visión** — identidad del ministerio.
- **Marco Legal** — normas que rigen la cultura (Constitución RBV, LA
  Conservación de Patrimonio, etc.).
- **Transparencia** — acceso a la información pública.
- **Contacto** — canales institucionales (sustituye los enlaces muertos).

Los enlaces "Becas y Ayudas", "Patrimonio Cultural" y secciones del pie con
enlace `#` se eliminan o dirigen a secciones/	páginas existentes.

## Seguridad

- Valores siempre por prepared statements (`pg` parametrizado).
- `sanitizar`-equivalente solo para salida (escape en React); el servidor
  valida tipos, rangos y opciones permitidas.
- Subidas: MIME real + extensión + tamaño máximo, nombre aleatorio.
- Sesiones: cookies `httpOnly`, `SameSite=Strict`, `Secure` en producción
  (CSRF mitigado por polí́tica de mismo sitio; sin tokens por formulario).
- Passwords con bcrypt (cost por defecto).
- Las apirest protegen: staff → calendario/cultores/reportes/crear-usuario;
  autor → editar/borrar publicación; dueño → borrar evento.

## Verificación

- `npm run db:init` idempotente (DROP/CREATE + schema + seed).
- Smoke test: arrancar `server` + levantar DB y verificar login, feed,
  creación de evento y reporte con `curl`/script.
- Frontend compilando con `npm run build` sin errores.

## Fuera de alcance (YAGNI)

- No se migran los datos reales del `.FDB` (no legible aquí); se recrean
  ejemplos equivalentes. Si más adelante hay acceso a Firebird, se migra con
  un script SQL puente.
- Sin panel de administración de noticias (hoy no existe CRUD de noticias).
- Sin correo transaccional ni reset de contraseña (no existían).
- Sin i18n (solo español, como hoy).