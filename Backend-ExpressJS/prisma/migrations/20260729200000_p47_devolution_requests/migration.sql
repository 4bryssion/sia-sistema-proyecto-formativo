-- (P47) Devoluciones en dos fases: el receptor REGISTRA la devolución y un
-- administrador o instructor cuentadante la AUTORIZA.
--
-- Por qué en tablas propias y no como filas de `loans`:
-- una solicitud de devolución no es un préstamo. Si viviera en `loans`, todo lo
-- que hoy cuenta, filtra o reporta préstamos (stock, firmas, reportes) tendría
-- que aprender a ignorar esas filas, y un préstamo con tres devoluciones
-- parciales aparecería como cuatro préstamos en el histórico.
--
-- Los dos estados que pide el requerimiento ("En espera de autorizar devolución
-- total" y "... parcial") son la combinación de estas dos columnas: `type` dice
-- total o parcial y `status` dice si ya se autorizó. Guardarlos como cuatro
-- valores de un solo enum duplicaría la misma información.
--
-- El préstamo original NO cambia de estado mientras hay una devolución pendiente:
-- sigue Activo, y solo pasa a Finalizado cuando todos sus materiales quedan
-- devueltos por completo.
CREATE TYPE "DevolutionType" AS ENUM ('Total', 'Parcial');
CREATE TYPE "DevolutionStatus" AS ENUM ('En_espera', 'Autorizada');

CREATE TABLE "devolution_requests" (
    "id"                SERIAL             NOT NULL,
    "loan_id"           INTEGER            NOT NULL,
    "type"              "DevolutionType"   NOT NULL,
    "status"            "DevolutionStatus" NOT NULL DEFAULT 'En_espera',
    -- Quién entrega el material. Puede ser el receptor del préstamo o un
    -- administrador que la registre en mostrador.
    "requested_by_id"   INTEGER            NOT NULL,
    -- Fecha y hora de la petición: el modal de autorizar la muestra
    "requested_at"      TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorized_by_id"  INTEGER,
    "authorized_at"     TIMESTAMP(3),
    "is_active"         BOOLEAN            NOT NULL DEFAULT true,
    "created_at"        TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolution_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "devolution_requests_loan_id_idx" ON "devolution_requests"("loan_id");
CREATE INDEX "devolution_requests_status_idx" ON "devolution_requests"("status");

CREATE TABLE "devolution_request_items" (
    "id"                       SERIAL           NOT NULL,
    "request_id"               INTEGER          NOT NULL,
    "material_id"              INTEGER          NOT NULL,
    -- Unidades que vuelven al almacén. En un devolutivo es lo que el receptor
    -- entrega; en un consumible es la "cantidad sobrante" que no se gastó.
    -- Es un solo dato porque en ambos casos responde a lo mismo: cuánto regresa.
    "returned_quantity"        INTEGER          NOT NULL,
    -- Lo que declara quien entrega (estado en que devuelve el material)
    "requester_observations"   VARCHAR(255)     NOT NULL DEFAULT '',
    -- Lo que decide quien autoriza. NULL mientras la solicitud está en espera.
    -- Solo 'Disponible' reintegra cantidad al inventario; Mantenimiento, Baja,
    -- Traslado y No_disponible cambian el estado del material pero NO devuelven
    -- la cantidad al stock.
    "material_status"          "MaterialStatus",
    "authorizer_observations"  VARCHAR(255)     NOT NULL DEFAULT '',

    CONSTRAINT "devolution_request_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "devolution_request_items_request_id_idx" ON "devolution_request_items"("request_id");

ALTER TABLE "devolution_requests" ADD CONSTRAINT "devolution_requests_loan_id_fkey"
    FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devolution_requests" ADD CONSTRAINT "devolution_requests_requested_by_id_fkey"
    FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "devolution_requests" ADD CONSTRAINT "devolution_requests_authorized_by_id_fkey"
    FOREIGN KEY ("authorized_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "devolution_request_items" ADD CONSTRAINT "devolution_request_items_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "devolution_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devolution_request_items" ADD CONSTRAINT "devolution_request_items_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cuánto de lo prestado ya volvió y fue autorizado. Es la resta que pide el
-- requerimiento: al autorizar una devolución parcial, esa cantidad deja de estar
-- pendiente en el préstamo original.
--
-- La fila NO se borra cuando el material queda devuelto del todo: `loan_returns`
-- tiene una clave foránea compuesta hacia (loan_id, material_id) y borrarla
-- destruiría el histórico del préstamo. Un material está devuelto por completo
-- cuando returned_quantity = borrowed_quantity, y así se muestra en la interfaz.
ALTER TABLE "loan_materials" ADD COLUMN "returned_quantity" INTEGER NOT NULL DEFAULT 0;
