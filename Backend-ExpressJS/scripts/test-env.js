// Ejecuta un comando con las variables de .env.test en lugar de las de .env.
//
//   node scripts/test-env.js <comando> [argumentos...]
//   Ej: node scripts/test-env.js npx prisma migrate deploy
//
// Por qué funciona: dotenv NO sobrescribe variables que ya existen en el proceso.
// Este script carga .env.test primero y le pasa ese entorno al comando hijo; cuando
// el hijo importe 'dotenv/config' (server.js, seed.js, prisma.config.ts), los
// valores de .env.test ya están puestos y los de .env se ignoran.
//
// Barrera de seguridad: se niega a correr si la base de datos de .env.test no
// tiene "test" en el nombre o si es la misma que la de .env. El seed de pruebas
// BORRA datos, y nunca debe poder apuntar por error a la base de desarrollo.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO_TEST = path.join(RAIZ, '.env.test');
const ARCHIVO_DEV = path.join(RAIZ, '.env');

const nombreBase = (url) => {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
};

const salir = (mensaje) => {
  console.error(`\n[test-env] ${mensaje}\n`);
  process.exit(1);
};

if (!fs.existsSync(ARCHIVO_TEST)) {
  salir('No existe .env.test. Copia .env.test.example a .env.test y complétalo (ver tests/README.md).');
}

const varsTest = dotenv.parse(fs.readFileSync(ARCHIVO_TEST));
const baseTest = nombreBase(varsTest.DATABASE_URL);

if (!baseTest) salir('DATABASE_URL de .env.test está vacía o mal escrita.');
if (!baseTest.toLowerCase().includes('test')) {
  salir(`La base de datos de .env.test se llama "${baseTest}". Por seguridad su nombre debe contener "test" (ej: sii_test).`);
}

if (fs.existsSync(ARCHIVO_DEV)) {
  const varsDev = dotenv.parse(fs.readFileSync(ARCHIVO_DEV));
  if (varsDev.DATABASE_URL && varsDev.DATABASE_URL === varsTest.DATABASE_URL) {
    salir('.env y .env.test apuntan a la MISMA base de datos. Usa una base aparte para las pruebas.');
  }
}

const [comando, ...args] = process.argv.slice(2);
if (!comando) salir('Falta el comando a ejecutar. Ej: node scripts/test-env.js npx prisma migrate deploy');

console.log(`[test-env] Base de datos de pruebas: ${baseTest}`);

const hijo = spawn(comando, args, {
  cwd: RAIZ,
  stdio: 'inherit',
  // shell: necesario en Windows para resolver npx/npm (.cmd)
  shell: true,
  env: { ...process.env, ...varsTest, NODE_ENV: 'test' },
});

hijo.on('exit', (codigo) => process.exit(codigo ?? 1));
