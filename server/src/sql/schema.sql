-- Réplica PostgreSQL del esquema Firebird de funcional/db/database.sql

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin','director_general','director_operativo','funcionario','cultor','publico')),
    password_hash VARCHAR(255) NOT NULL,
    foto_url VARCHAR(255),
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