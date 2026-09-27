# Ambiente de pruebas — Matriz de Casos de Prueba v6

Todo lo necesario para ejecutar los casos de la Matriz v6 contra el backend sin
tocar la base de datos de desarrollo.

| Qué | Dónde |
|---|---|
| Pruebas unitarias (Jest) | `src/**/<archivo>.test.js`, junto al archivo que prueban |
| Prueba de humo de Jest | `tests/smoke/jest-config.test.js` (no es un caso de la matriz) |
| Colección y entorno de Postman | `tests/postman/` |
| Archivos para subir (imágenes, PDF, Excel, no permitidos) | `tests/fixtures/` |
| Archivos grandes (límites de tamaño) | `tests/fixtures/generados/` — se crean con `npm run test:fixtures` |
| Datos de prueba de la base | `prisma/seed-test.js` |
| Variables del ambiente de pruebas | `.env.test` (copia de `.env.test.example`, no se sube al repo) |

## 1. Preparación (una sola vez)

Desde `Backend-ExpressJS/`:

```bash
npm install                          # instala Jest y babel-jest (devDependencies)
cp .env.test.example .env.test       # y completa DATABASE_URL, correo, etc.
```

Crea la base de datos de pruebas en PostgreSQL (el nombre debe contener `test`):

```sql
CREATE DATABASE sii_test;
```

Luego:

```bash
npm run test:db:setup                # migraciones + seed base + seed de pruebas
npm run test:fixtures                # genera los PDF de 9MB y 11MB
```

> Los scripts `test:db:*` y `test:server` se niegan a correr si la base de
> `.env.test` no tiene `test` en el nombre o si es la misma de `.env`: el seed de
> pruebas **borra** los datos de negocio antes de cargar los suyos.

## 2. Antes de cada sesión de pruebas

```bash
npm run test:db:seed                 # deja los datos en el punto de partida
npm run test:server                  # backend en :5000 con .env.test (detén antes `npm run dev`)
```

El frontend se levanta como siempre (`npm run dev` en `Frontend-React/`): apunta a
`localhost:5000`, así que queda conectado al backend de pruebas.

`test:db:seed` imprime al final la tabla de usuarios, los **enlaces de firma** de
los préstamos pendientes y los **ids** de préstamos, materiales y cotizaciones.

## 3. Pruebas unitarias (Jest)

```bash
npm test                                            # todas
npm test -- src/features/loans/loan.stock.test.js   # un archivo
npm run test:coverage                               # con reporte de cobertura
```

No usan `.env.test` ni ninguna base de datos: `jest.setup.cjs` define valores
ficticios y cada prueba simula (`jest.mock`) los repositories que necesite.

## 4. Postman

1. Importa `tests/postman/SII-Pruebas.postman_collection.json` y
   `tests/postman/SII-Pruebas.postman_environment.json`.
2. Selecciona el entorno **S.I.I - Pruebas (local)**.
3. Ejecuta la carpeta **00 - Sesiones**: guarda un token por rol
   (`tokenAdmin`, `tokenInstructor`, `tokenInvitado`, `tokenSinPermisos`,
   `tokenTemporal`, `tokenSuperAdmin`).
4. Ejecuta los casos del módulo (carpetas 01 a 17). Cada módulo trae una petición
   `[BASE]` que confirma que responde.
5. Al terminar, ejecuta **99 - Cerrar sesiones**.

Si cambiaste `TEST_EMAIL_BASE` en `.env.test`, actualiza los `email*` del entorno.
Los ids del entorno (`loanActivoId`, `materialTaladroId`…) coinciden con los que
imprime el seed; el seed reinicia los ids en cada ejecución, así que no cambian.

## 5. Usuarios de prueba

Contraseña de todos: `TEST_USERS_PASSWORD` (por defecto `Prueba123*`).
Correo: `TEST_EMAIL_BASE` con `+alias`, ej. `pruebas.sii+admin.ui@gmail.com`.

| Alias | Grupo | Estado | Uso |
|---|---|---|---|
| `admin.ui` | Administrador | activo | Navegador |
| `instructor.ui` | Instructor | activo, cuentadante | Navegador (prestador) |
| `instructor2.ui` | Instructor | activo, cuentadante | Navegador |
| `invitado.ui` | Invitado | activo | Navegador (receptor, tareas) |
| `admin.api` | Administrador | activo | Postman |
| `instructor.api` | Instructor | activo | Postman |
| `invitado.api` | Invitado | activo | Postman |
| `sinpermisos` | — | activo, sin grupo | Casos de 403 |
| `inactivo` | Invitado | `isActive = false` | Login rechazado |
| `vencido` | Invitado | vigencia terminada ayer | Tarea diaria de vencimiento |
| `futuro` | Invitado | vigencia empieza en 10 días | Login rechazado |
| `temporal.ui` / `temporal.api` | Invitado | contraseña temporal | Cambio obligatorio (403 en el resto del API) |
| `superadmin@sia.local` | SuperAdmin | activo | Auditoría (`ADMIN_PASSWORD`) |

**La sesión es única por usuario:** un mismo usuario no puede estar a la vez en el
navegador y en Postman (el segundo inicio de sesión responde 409). Por eso existen
los usuarios `.ui` y `.api`.

## 6. Datos que deja el seed

| Id | Registro | Estado |
|---|---|---|
| Préstamo 1 | Interno, Cable HDMI ×2 + Cámara | Pendiente de firma |
| Préstamo 2 | Externo (`+externo`), Resma ×5 | Pendiente de firma |
| Préstamo 3 | Interno, Multímetro + Resma ×10 | Activo, sin devoluciones |
| Préstamo 4 | Marcadores ×2 | Activo, con devolución parcial **en espera** (devolución 1) |
| Préstamo 5 | Portátil | Finalizado (devolución 2 autorizada) |
| Préstamo 6 | Mesa plegable | Activo pero desactivado |
| Materiales 1–4 | Resma (35), Cable (8), Marcadores (1), Tóner (inactivo) | De consumo |
| Materiales 5–10 | Taladro, Portátil, Mesa, Proyector (mantenimiento), Multímetro y Cámara (en préstamo) | Devolutivos |
| Cotizaciones 1–3 | `cotizacion-1/2/3.pdf` | La 3 deshabilitada |
| Grupos 5 y 6 | Grupo de Pruebas / Grupo Inactivo Pruebas | Activo / inactivo |

También: marcas e inventarios activos e inactivos, una categoría y un tipo de
documento inactivos, 6 tareas (en progreso, completada, no completada, una vencida
que sigue "en progreso", una de otro usuario y una desactivada) y 3 notificaciones.

## 7. Archivos de prueba (`tests/fixtures/`)

| Archivo | Para qué |
|---|---|
| `imagen-valida.png` / `.jpg`, `imagen-2/3/4.png` | Imágenes válidas (4 para probar el máximo de 3) |
| `ficha-tecnica.pdf`, `ficha-tecnica-2/3/4.pdf`, `ficha-tecnica.xlsx` | Fichas válidas (4 para el máximo de 3) |
| `cotizacion-1.pdf` … `cotizacion-7.pdf` | Cotizaciones (7 para el máximo de 6 por carga) |
| `cotizacion-1-copia.pdf` | Mismo contenido que `cotizacion-1.pdf`: detección de duplicados |
| `no-permitido.txt`, `no-permitido.gif` | Tipos de archivo rechazados |
| `generados/archivo-11MB.pdf` | Supera los 10MB por archivo |
| `generados/pdf-9MB-1..4.pdf` | Válidos uno a uno, pero juntos superan los 30MB por envío |

## 8. A tener en cuenta

- **Vigencia vencida:** al arrancar, el servidor ejecuta la tarea diaria que
  desactiva a los usuarios vencidos, así que `vencido` aparece **inactivo** apenas
  corre `test:server`. Para ver el mensaje de login "Tu vínculo finalizó…", cambia su
  `user_end_date` a una fecha pasada **después** de arrancar el servidor.
- **Sesión:** vence tras 5 minutos sin peticiones. En Postman, la petición
  "Mantener sesión viva (latido)" la renueva.
- **Correo:** credenciales, firmas de préstamo y códigos de recuperación salen por el
  SMTP de `.env.test`. Con Gmail, todos los `+alias` llegan al mismo buzón.
- **Seed:** `npm run test:db:seed` solo se ejecuta contra la base de pruebas; el
  seed de desarrollo (`npx prisma db seed`) sigue requiriendo autorización.
