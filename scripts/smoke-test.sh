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