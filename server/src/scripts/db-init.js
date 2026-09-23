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