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
app.use('/api/eventos', rutasEventos);
app.use('/api/cultores', autenticar, rutasCultores);
app.use('/api/foro', rutasForo);
app.use('/api/noticias', rutasNoticias);
app.use('/api/usuarios', autenticar, rutasUsuarios);
app.use('/api/reportes', autenticar, rutasReportes);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.code === 'FORMATO_NO_PERMITIDO') {
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT || 4000}`);
});