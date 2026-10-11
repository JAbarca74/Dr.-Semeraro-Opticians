#!/usr/bin/env node
/**
 * Escáner de secretos. Falla (exit 1) si un archivo versionado contiene algo que
 * parece una credencial real, o si se versiona un `.env` que no sea la plantilla.
 *
 * Nace del hallazgo de 2026-08: `.env.supabase.bak` se subió a GitHub con la
 * contraseña de la base y el `JWT_SECRET`. Un `.gitignore` no basta: cubre lo que
 * alguien previó, no lo que se nombra distinto. Esto revisa el CONTENIDO.
 *
 * Uso:
 *   node scripts/escanear-secretos.mjs            todo lo versionado (CI)
 *   node scripts/escanear-secretos.mjs a.ts b.ts  solo esos archivos (pre-commit)
 *
 * Nunca imprime el valor encontrado: solo archivo, línea y tipo.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const PLANTILLA = /(\[|<|>|\$\{|tu_|su_|your|example|changeme|cambi[ae]|xxx|\*\*\*|password\]|contrase)/i;

const REGLAS = [
  {
    tipo: 'URL de base de datos con contraseña',
    re: /postgres(?:ql)?:\/\/[^:\s'"@]+:([^@\s'"]{4,})@/,
    valor: (m) => m[1],
  },
  {
    tipo: 'JWT_SECRET / clave asignada con valor real',
    re: /\b(?:JWT_SECRET|DB_PASSWORD|SECRET_KEY|API_KEY|SERVICE_ROLE_KEY)\s*[:=]\s*['"]?([A-Za-z0-9+/_=-]{16,})/,
    valor: (m) => m[1],
  },
  { tipo: 'clave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { tipo: 'clave de AWS', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { tipo: 'clave de Stripe', re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/ },
  {
    tipo: 'token JWT literal',
    re: /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/,
  },
];

const IGNORADOS = /(^|\/)(package-lock\.json|escanear-secretos\.mjs|.*\.(png|jpe?g|webp|ico|pdf|woff2?))$/;

const archivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);

const hallazgos = [];

for (const archivo of archivos) {
  const base = archivo.split('/').pop() ?? archivo;
  if (/^\.env(\..+)?$/.test(base) && base !== '.env.example') {
    hallazgos.push(`${archivo}: archivo de entorno versionado (solo se admite .env.example)`);
    continue;
  }
  if (IGNORADOS.test(archivo)) continue;
  let texto;
  try {
    if (!statSync(archivo).isFile() || statSync(archivo).size > 1_000_000) continue;
    texto = readFileSync(archivo, 'utf8');
  } catch {
    continue;
  }
  texto.split(/\r?\n/).forEach((linea, i) => {
    for (const { tipo, re, valor } of REGLAS) {
      const m = linea.match(re);
      if (!m) continue;
      if (valor && PLANTILLA.test(valor(m))) continue;
      if (!valor && PLANTILLA.test(linea)) continue;
      hallazgos.push(`${archivo}:${i + 1}: ${tipo}`);
    }
  });
}

if (hallazgos.length) {
  console.error('Posibles secretos en archivos versionados:\n');
  for (const h of hallazgos) console.error('  ✗ ' + h);
  console.error(
    '\nSi es real: sácalo del repositorio y ROTA la credencial (borrarla del último commit no la quita del historial).',
  );
  process.exit(1);
}
console.log(`Sin secretos en ${archivos.length} archivo(s).`);
