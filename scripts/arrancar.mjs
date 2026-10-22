#!/usr/bin/env node
/**
 * Arranque completo del proyecto en local, con un solo comando: `npm start`.
 *
 * Deja listo todo lo necesario y no asume nada del equipo de quien lo ejecuta:
 *   1. comprueba Node, Docker y que el repo de la API esté al lado,
 *   2. crea los `.env` que falten a partir de los `.env.example`,
 *   3. instala dependencias en ambos repos si no están,
 *   4. levanta PostgreSQL en Docker y espera a que acepte conexiones,
 *   5. aplica migraciones y carga el seed (idempotente),
 *   6. arranca API y frontend a la vez y no vuelve hasta que se corta con Ctrl+C.
 *
 * Es idempotente: se puede ejecutar tantas veces como haga falta. Los pasos ya
 * hechos se detectan y se saltan.
 *
 * Node 24+. Sin dependencias externas a propósito: tiene que funcionar antes de
 * que exista `node_modules`.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'node:net';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = resolve(WEB, '..', 'optica-semeraro-api');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `[${code}m${s}[0m` : s);
const paso = (n, s) => console.log(`\n${c('36;1', `[${n}/6]`)} ${c('1', s)}`);
const ok = (s) => console.log(`      ${c('32', '✓')} ${s}`);
const info = (s) => console.log(`      ${c('90', s)}`);

function morir(titulo, comoArreglarlo) {
  console.error(`\n${c('31;1', '✗ ' + titulo)}\n`);
  for (const linea of comoArreglarlo) console.error(`  ${linea}`);
  console.error('');
  process.exit(1);
}

/** Ejecuta un comando y aborta con instrucciones si falla. */
function correr(cmd, args, cwd, { titulo, ayuda }) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) morir(titulo, ayuda);
}

const silencioso = (cmd, args) =>
  spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });

/** ¿Hay algo escuchando en este puerto? */
const responde = (host, port, ms = 1500) =>
  new Promise((res) => {
    const s = createConnection({ host, port })
      .on('connect', () => (s.end(), res(true)))
      .on('error', () => res(false));
    s.setTimeout(ms, () => (s.destroy(), res(false)));
  });

/** Espera a que un puerto acepte conexiones; si no llega, explica ese servicio. */
async function esperarPuerto(host, port, segundos, queEs, ayuda) {
  const limite = Date.now() + segundos * 1000;
  while (Date.now() < limite) {
    if (await responde(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  morir(`${queEs} no respondió en ${segundos}s (${host}:${port})`, ayuda);
}

/**
 * Aborta si algún puerto ya está ocupado. Sin esto el fallo aparece tarde y
 * disfrazado: la API muere con EADDRINUSE y Vite se muda de puerto en silencio,
 * así que el arranque parece colgarse sin motivo.
 */
async function exigirPuertosLibres() {
  const puertos = [
    [3000, 'la API'],
    [5173, 'el frontend'],
    [5432, 'PostgreSQL'],
  ];
  const ocupados = [];
  for (const [port, quien] of puertos) {
    // 5432 puede ser nuestro propio contenedor ya levantado: eso no estorba.
    if (port === 5432) continue;
    if (await responde('localhost', port, 800)) ocupados.push(`${port} (${quien})`);
  }
  if (ocupados.length === 0) return ok('Puertos 3000 y 5173 libres');

  const cmd =
    process.platform === 'win32'
      ? 'netstat -ano | findstr :3000'
      : 'lsof -i :3000';
  morir(`Puertos ocupados: ${ocupados.join(', ')}`, [
    'Seguramente tienes otra copia del proyecto corriendo en otra terminal.',
    'Ciérrala (Ctrl+C) y vuelve a lanzar este comando.',
    '',
    'Si no encuentras cuál es, busca el proceso con:',
    c('36', `  ${cmd}`),
  ]);
}

// ── 1. Requisitos ───────────────────────────────────────────────────────────
paso(1, 'Comprobando requisitos');

const major = Number(process.versions.node.split('.')[0]);
if (major < 24) {
  morir(`Node 24 o superior es necesario (tienes ${process.versions.node})`, [
    'Instálalo desde https://nodejs.org (versión LTS).',
  ]);
}
ok(`Node ${process.versions.node}`);

if (!existsSync(API)) {
  morir('No encuentro el repositorio de la API', [
    `Lo busqué en: ${c('33', API)}`,
    '',
    'Los dos repos tienen que estar en la misma carpeta, uno al lado del otro:',
    '',
    '  ├── optica-semeraro-web   (este)',
    '  └── optica-semeraro-api',
    '',
    'Clónalo con:',
    c('36', '  git clone https://github.com/JAbarca74/optica-semeraro-api'),
  ]);
}
ok('Repositorio de la API encontrado');

if (silencioso('docker', ['--version']).status !== 0) {
  morir('Docker no está instalado', [
    'Instala Docker Desktop desde https://www.docker.com/products/docker-desktop',
    'La base de datos corre en un contenedor; no hace falta instalar PostgreSQL.',
  ]);
}
if (silencioso('docker', ['info']).status !== 0) {
  morir('Docker está instalado pero no se está ejecutando', [
    'Abre Docker Desktop y espera a que el icono deje de moverse.',
    'Después vuelve a lanzar este mismo comando.',
  ]);
}
ok('Docker en ejecución');

await exigirPuertosLibres();

// ── 2. Variables de entorno ─────────────────────────────────────────────────
paso(2, 'Preparando variables de entorno');

/**
 * Crea el archivo solo si no existe, en una única operación (`wx`): comprobar
 * con `existsSync` y escribir después deja una ventana en la que otro proceso
 * podría crearlo o sustituirlo. Devuelve `false` si ya existía.
 */
function crearSiNoExiste(ruta, contenido) {
  try {
    writeFileSync(ruta, contenido, { flag: 'wx', mode: 0o600 });
    return true;
  } catch (e) {
    if (e.code === 'EEXIST') return false;
    throw e;
  }
}

// Secreto propio de cada equipo: nunca se comparte ni se versiona.
const envApiTexto = readFileSync(join(API, '.env.example'), 'utf8').replace(
  /^JWT_SECRET=.*$/m,
  `JWT_SECRET=${randomBytes(32).toString('hex')}`,
);
if (crearSiNoExiste(join(API, '.env'), envApiTexto)) {
  ok('api/.env creado con un JWT_SECRET aleatorio');
} else {
  info('api/.env ya existe, no se toca');
}

if (crearSiNoExiste(join(WEB, '.env'), 'VITE_API_URL=http://localhost:3000/api\n')) {
  ok('web/.env creado');
} else {
  info('web/.env ya existe, no se toca');
}

// ── 3. Dependencias ─────────────────────────────────────────────────────────
paso(3, 'Instalando dependencias');
for (const [nombre, ruta] of [['API', API], ['web', WEB]]) {
  const manifiesto = JSON.parse(readFileSync(join(ruta, 'package.json'), 'utf8'));
  const dependencias = Object.keys({ ...manifiesto.dependencies, ...manifiesto.devDependencies });
  const completas = dependencias.every((dependencia) => existsSync(join(ruta, 'node_modules', dependencia, 'package.json')));
  if (completas) {
    info(`${nombre}: ya instaladas`);
  } else {
    console.log(`      instalando las de ${nombre}, tarda un poco la primera vez…`);
    correr(npm, ['install'], ruta, {
      titulo: `Falló la instalación de dependencias en ${nombre}`,
      ayuda: [`Prueba a mano:`, c('36', `  cd ${ruta} && npm install`)],
    });
    ok(`${nombre}: instaladas`);
  }
}

// `.npmrc` instala sin scripts (`ignore-scripts`), así que el `prepare` de Husky
// ya no corre solo. Sin él no existe el pre-commit que escanea secretos: se
// instala aquí, explícitamente. `--no` impide descargar nada que no esté en el lockfile.
if (existsSync(join(WEB, '.git'))) {
  correr(npm, ['exec', '--no', '--', 'husky'], WEB, {
    titulo: 'No se pudieron instalar los hooks de git (Husky)',
    ayuda: ['Prueba a mano:', c('36', '  npx --no husky')],
  });
  ok('web: hooks de git activos (escaneo de secretos antes de cada commit)');
}

// ── 4. Base de datos ────────────────────────────────────────────────────────
paso(4, 'Levantando PostgreSQL y el correo local en Docker');
correr('docker', ['compose', 'up', '-d', '--wait'], API, {
  titulo: 'No se pudieron levantar los servicios locales',
  ayuda: [
    'Comprueba si los puertos 5432, 1025 o 8025 están ocupados.',
    'Comprueba qué lo usa y ciérralo, o cambia el puerto en:',
    c('36', '  optica-semeraro-api/docker-compose.yml'),
  ],
});
await esperarPuerto('localhost', 5432, 60, 'PostgreSQL', [
  'Comprueba el estado del contenedor:',
  c('36', '  docker ps -a --filter name=optica-semeraro-db'),
  'Y sus registros:',
  c('36', '  docker logs optica-semeraro-db'),
]);
ok('PostgreSQL aceptando conexiones en localhost:5432');
ok('Buzón local de invitaciones: http://localhost:8025 (no envía correos reales)');

// ── 5. Esquema y datos ──────────────────────────────────────────────────────
paso(5, 'Aplicando migraciones y datos iniciales');
correr(npm, ['run', 'migration:run'], API, {
  titulo: 'Fallaron las migraciones',
  ayuda: [
    'Revisa el error anterior antes de volver a intentar. Conserva los datos existentes.',
    'Si aparece UQ_usuario_email_normalizado, hay correos de usuario duplicados al ignorar mayúsculas o espacios.',
    'Verifica esas cuentas y corrige los duplicados antes de reintentar la migración.',
  ],
});
ok('Esquema al día');

correr(npm, ['run', 'seed'], API, {
  titulo: 'Falló la carga de datos iniciales',
  ayuda: ['Reintenta con:', c('36', '  cd ../optica-semeraro-api && npm run seed')],
});
ok('Permisos, RBAC y cuentas de demo listos');

// ── 6. Arranque ─────────────────────────────────────────────────────────────
paso(6, 'Arrancando API y frontend');

const hijos = [];
function arrancar(nombre, args, cwd, tinte) {
  const p = spawn(npm, args, { cwd, shell: process.platform === 'win32' });
  const etiqueta = c(tinte, nombre.padEnd(3));
  const volcar = (buf) => {
    for (const l of buf.toString().split('\n')) {
      if (l.trim()) console.log(`${etiqueta} ${l}`);
    }
  };
  p.stdout.on('data', volcar);
  p.stderr.on('data', volcar);
  p.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n${c('31', `✗ ${nombre} se detuvo con código ${code}`)}`);
    }
    cerrar();
  });
  hijos.push(p);
}

let cerrando = false;
function cerrar() {
  if (cerrando) return;
  cerrando = true;
  console.log(`\n${c('90', 'Deteniendo procesos…')}`);
  for (const p of hijos) {
    try {
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', p.pid, '/T', '/F']);
      else p.kill('SIGTERM');
    } catch {
      /* el proceso ya había terminado */
    }
  }
  info('La base de datos sigue levantada. Para pararla: npm run db:down (en la API).');
  process.exit(0);
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);

arrancar('api', ['run', 'start:dev'], API, '35');
arrancar('web', ['run', 'dev'], WEB, '36');

await esperarPuerto('localhost', 3000, 120, 'La API', [
  'Mira las líneas marcadas con «api» más arriba: ahí está el error real.',
  'Lo más común es no poder conectar con la base de datos.',
]);
await esperarPuerto('localhost', 5173, 120, 'El frontend', [
  'Mira las líneas marcadas con «web» más arriba: ahí está el error real.',
]);

console.log(`
${c('32;1', '  Todo listo.')}

  ${c('1', 'Frontend')}  http://localhost:5173
  ${c('1', 'API')}       http://localhost:3000/api

  ${c('1', 'Cuentas de prueba')} (botones «acceso directo» en la pantalla de login)
    admin@optica.local      admin1234       Administrador
    doctor@optica.local     doctor1234      Doctor
    recepcion@optica.local  recepcion1234   Recepción

  ${c('90', 'Ctrl+C para detener.')}
`);
