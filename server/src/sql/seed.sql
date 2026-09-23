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