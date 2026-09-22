# S.I.I — Software de Inventario de Infraestructura

Sistema de gestión de inventario del SENA.

- **Backend-ExpressJS** — Node 22 · Express 5 · Prisma 6.19 · PostgreSQL
- **Frontend-React** — React 19 · Vite 7 · Tailwind 4

---

## Puesta en marcha desde cero

Lo que hace falta tener instalado: **Node.js 22 o superior**, **PostgreSQL 14 o
superior** y **Git**.

### 1. Clonar y crear la base de datos

```bash
git clone <url-del-repositorio>
cd SistemaProyectoFormativo
```

La base de datos hay que crearla a mano una vez (desde pgAdmin, o con `psql`):

```sql
CREATE DATABASE "inventoryDB";
```

El nombre es libre, pero tiene que coincidir con el de la cadena de conexión del
paso siguiente.

### 2. Backend

```bash
cd Backend-ExpressJS
npm install
```

Copiar el archivo de ejemplo y rellenarlo:

```bash
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
```

Las dos que **sí o sí** hay que cambiar:

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | `postgresql://USUARIO:CONTRASEÑA@localhost:5432/inventoryDB` |
| `JWT_SECRET` | Cualquier cadena larga y aleatoria. No la compartan entre equipos. |

`JWT_EXPIRES` admite algo como `8h`. Las variables de correo (`EMAIL_*`) solo
hacen falta para la recuperación de contraseña y para los enlaces de firma de
préstamos: sin ellas el resto del sistema funciona, pero esos envíos fallan.

Crear las tablas y los datos base:

```bash
npx prisma migrate dev     # crea el esquema completo
npx prisma db seed         # permisos, roles, catálogos y el usuario SuperAdmin
```

Y levantarlo:

```bash
npm run dev                # queda escuchando en http://localhost:5000
```

### 3. Frontend

En **otra terminal**, sin cerrar la anterior:

```bash
cd Frontend-React
npm install
npm run dev                # queda en http://localhost:5173
```

No necesita `.env`: la dirección del backend está escrita en el código y apunta
a `http://localhost:5000`.

### 4. Entrar

El seed crea el usuario SuperAdmin con el correo `superadmin@sia.local` y la
contraseña que se haya puesto en `ADMIN_PASSWORD`. En el primer inicio de sesión
el sistema obliga a cambiarla.

---

## Al traer cambios de otra persona (`git pull`)

El orden importa. Si alguien tocó la base de datos, saltárselo deja el proyecto
arrancando contra un esquema que ya no existe.

```bash
git pull

cd Backend-ExpressJS
npm install                # por si entraron dependencias nuevas
npx prisma migrate dev     # aplica las migraciones que hayan llegado
npx prisma db seed         # idempotente: solo añade lo que falta
npm run dev

cd ../Frontend-React
npm install
npm run dev
```

### Dos comandos más, solo una vez, al traer los cambios de la p50

Estos dos existen porque la p50 añadió reglas sobre datos que ya estaban
guardados. Quien tenga una base de datos con información previa debe correrlos;
quien empiece de cero no los necesita.

```bash
cd Backend-ExpressJS

# ANTES de migrar: busca marcas, categorías, inventarios o grupos que solo se
# diferencian por mayúsculas o tildes («Gucci» y «GuccI»). La migración que
# impide esos duplicados no se aplica mientras existan. Solo lee.
npm run revisar-duplicados

# DESPUÉS de migrar: calcula la huella de las cotizaciones ya cargadas, que es
# lo que permite avisar de un PDF repetido. Sin esto, solo se comparan las que
# se carguen de ahora en adelante.
npm run hashear-cotizaciones
```

---

## Cosas que conviene saber

**Las migraciones se versionan.** `prisma/migrations/` está en el repositorio a
propósito: es lo que mantiene las bases de datos de todos iguales. Nadie debe
crear una migración para un cambio que ya hizo otra persona — primero `git pull`,
después `migrate dev`.

**`uploads/` no se versiona.** Los archivos que se suben —fotos, fichas técnicas,
cotizaciones— son datos, no código. Cada quien tiene los suyos. La carpeta se
crea sola al arrancar el backend.

**El `.env` tampoco.** Por eso existe `.env.example`: cuando alguien añada una
variable nueva, tiene que añadirla también al ejemplo, o el resto del equipo se
entera cuando algo revienta.

**Si `prisma migrate dev` pide crear una migración que nadie escribió**, no le
pongan nombre: significa que la base de datos y el esquema no coinciden. Cancelar
con Ctrl+C y revisar con:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

---

## Problemas frecuentes

| Síntoma | Qué pasa |
|---|---|
| `Can't reach database server` | PostgreSQL no está encendido, o el usuario, la contraseña o el nombre de la base en `DATABASE_URL` no son los correctos. |
| `Error: P1000 Authentication failed` | Contraseña equivocada en `DATABASE_URL`. |
| Todo carga pero nada responde | El backend no está levantado. Son **dos** terminales: una para cada mitad. |
| `psql : no se reconoce` | `psql` no está en el PATH de Windows. Usar pgAdmin, o los comandos `npm run` de arriba, que no lo necesitan. |
| Al iniciar sesión: «Ya tienes una sesión abierta» | Hay otra ventana o navegador con la sesión viva. Cerrarla, o esperar unos segundos a que se libere sola. |
| La campana de notificaciones no aparece | Falta correr `npx prisma db seed`: el permiso para verla se reparte ahí. |

---

## Estructura

```
SistemaProyectoFormativo/
├── Backend-ExpressJS/
│   ├── prisma/           esquema, migraciones, seed y scripts de mantenimiento
│   ├── src/
│   │   ├── config/       cliente de Prisma, auditoría, correo, sesión
│   │   ├── features/     un módulo por dominio (rutas, controller, service, repositorio)
│   │   ├── middleware/   autenticación, permisos, subida de archivos, errores
│   │   └── shared/       utilidades transversales
│   └── uploads/          archivos subidos (no versionado)
└── Frontend-React/
    └── src/
        ├── app/          router
        ├── features/     un módulo por dominio (páginas, tablas, hooks)
        └── shared/       componentes, servicios, hooks y utilidades comunes
```

Regla del proyecto: **ningún módulo de `features/` importa de otro**. Lo que
necesiten dos o más vive en `shared/`.

---

Grupo 7 — Proyecto Formativo
Santiago Acevedo Medina · Sofía Cardona Ramírez · Maicol Esteban Franco Román
