-- CreateEnum
CREATE TYPE "TipoCuentadante" AS ENUM ('Solidario', 'Cuentadante');

-- CreateEnum
CREATE TYPE "EstadoMaterial" AS ENUM ('Disponible', 'No_disponible', 'Mantenimiento', 'En_prestamo', 'Traslado', 'Baja');

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" SERIAL NOT NULL,
    "nombre_documento" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(150),

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" SERIAL NOT NULL,
    "nombre_grupo" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "nombre_permiso" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_permisos" (
    "grupo_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "grupo_permisos_pkey" PRIMARY KEY ("grupo_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "id_tipo_documento" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "numero_documento" VARCHAR(20) NOT NULL,
    "fecha_finalizacion" DATE NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "segundo_telefono" VARCHAR(15),
    "direccion" VARCHAR(150) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "foto" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "cuentadante" "TipoCuentadante" NOT NULL DEFAULT 'Solidario',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_grupos" (
    "usuario_id" INTEGER NOT NULL,
    "grupo_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_grupos_pkey" PRIMARY KEY ("usuario_id","grupo_id")
);

-- CreateTable
CREATE TABLE "usuario_permisos" (
    "usuario_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_permisos_pkey" PRIMARY KEY ("usuario_id","permiso_id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre_marca" VARCHAR(100) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre_categoria" VARCHAR(100) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_consumo" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_marca" INTEGER NOT NULL,
    "placa_sena" VARCHAR(20),
    "nombre_material" VARCHAR(100) NOT NULL,
    "imagen" TEXT NOT NULL,
    "cantidad" INTEGER,
    "valor_unitario" DECIMAL(15,2) NOT NULL,
    "valor_total" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoMaterial" NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha_compra" DATE NOT NULL,
    "ubicacion" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_consumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_devolutivo" (
    "id" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "serial" VARCHAR(20) NOT NULL,
    "ficha_tecnica" TEXT NOT NULL,
    "dimensiones" VARCHAR(100),

    CONSTRAINT "materiales_devolutivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad_prestada" INTEGER NOT NULL,
    "grupo_aprendices" INTEGER NOT NULL,
    "justificacion_uso" VARCHAR(255) NOT NULL,
    "fecha_devolucion" DATE NOT NULL,
    "fecha_prestamo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retornos_prestamo" (
    "id" SERIAL NOT NULL,
    "id_prestamo" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad_sobrante" INTEGER,
    "observaciones" VARCHAR(255) NOT NULL,
    "fecha_devolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retornos_prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_tarea" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_nombre_documento_key" ON "tipos_documento"("nombre_documento");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_grupo_key" ON "grupos"("nombre_grupo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_nombre_permiso_key" ON "permisos"("nombre_permiso");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_documento_key" ON "usuarios"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_foto_key" ON "usuarios"("foto");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_marca_key" ON "marcas"("nombre_marca");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_categoria_key" ON "categorias"("nombre_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_consumo_placa_sena_key" ON "materiales_consumo"("placa_sena");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_devolutivo_serial_key" ON "materiales_devolutivo"("serial");

-- AddForeignKey
ALTER TABLE "grupo_permisos" ADD CONSTRAINT "grupo_permisos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_permisos" ADD CONSTRAINT "grupo_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_tipo_documento_fkey" FOREIGN KEY ("id_tipo_documento") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_grupos" ADD CONSTRAINT "usuario_grupos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_grupos" ADD CONSTRAINT "usuario_grupos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_consumo" ADD CONSTRAINT "materiales_consumo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_consumo" ADD CONSTRAINT "materiales_consumo_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_devolutivo" ADD CONSTRAINT "materiales_devolutivo_id_fkey" FOREIGN KEY ("id") REFERENCES "materiales_consumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_devolutivo" ADD CONSTRAINT "materiales_devolutivo_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales_consumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retornos_prestamo" ADD CONSTRAINT "retornos_prestamo_id_prestamo_fkey" FOREIGN KEY ("id_prestamo") REFERENCES "prestamos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retornos_prestamo" ADD CONSTRAINT "retornos_prestamo_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materiales_consumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
