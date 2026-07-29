-- Instructor de planta / administrador: sin fecha de finalización de vínculo.
-- El frontend (Zod) y el backend (Joi) ya trataban el campo como opcional;
-- la columna NOT NULL era lo único que rompía la creación de esos usuarios.
ALTER TABLE "users" ALTER COLUMN "user_end_date" DROP NOT NULL;
