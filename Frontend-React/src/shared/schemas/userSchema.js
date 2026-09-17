import { z } from "zod";

// Fecha de hoy LOCAL en YYYY-MM-DD; se compara como string contra el input type="date"
// (evita el bug de zona horaria de new Date("YYYY-MM-DD"), que parsea en UTC)
export const todayLocalISO = () => new Date().toLocaleDateString("en-CA");

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// (p48) La vigencia del vínculo gobierna el acceso, así que las dos fechas son
// obligatorias y se validan entre sí:
//   - inicio: admite fechas PASADAS (se registra a alguien que ya venía trabajando).
//     Antes de ella el login rechaza aunque las credenciales sean correctas.
//   - finalización: no puede ser anterior al inicio ni a hoy; cumplida, la tarea
//     diaria desactiva al usuario.
// Se comparan como texto YYYY-MM-DD, que ordena igual que la fecha y no arrastra
// el desfase de zona horaria.
const validarVigencia = (data, ctx) => {
  if (data.userStartDate && data.userEndDate && data.userEndDate < data.userStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userEndDate"],
      message: "La fecha de finalización no puede ser anterior a la de inicio",
    });
  }
};

const campos = {
  userFirstName: z.string().min(3, "El nombre debe tener mínimo 3 caracteres").max(100, "Demasiado largo"),

  userLastName: z.string().min(3, "El apellido debe tener mínimo 3 caracteres").max(100, "Demasiado largo"),

  documentTypeId: z.string().min(1, "Seleccione un tipo de documento"),

  userDocumentNumber: z.string().min(5, "Número inválido").max(20, "Demasiado largo"),

  // (p48) Nueva y obligatoria. Admite fechas pasadas a propósito.
  userStartDate: z
    .string()
    .min(1, "La fecha de inicio es obligatoria")
    .regex(FORMATO_FECHA, "Formato YYYY-MM-DD"),

  // (p48) Vuelve a ser obligatoria SIEMPRE: desapareció la excepción de
  // "instructor de planta", que era lo único que permitía dejarla vacía.
  userEndDate: z
    .string()
    .min(1, "La fecha de finalización es obligatoria")
    .regex(FORMATO_FECHA, "Formato YYYY-MM-DD")
    // Hoy es válido; anteriores no
    .refine((v) => v >= todayLocalISO(), "La fecha de finalización no puede ser anterior a hoy"),

  userEmail: z.string().email("Correo personal inválido"),

  userEmailInstitutional: z.string().email("Correo institucional inválido").or(z.literal("")).optional(),

  userPhone: z.string().regex(/^[0-9]{7,15}$/, "Teléfono de 7 a 15 dígitos"),
  userSecondPhone: z.string().regex(/^[0-9]{7,15}$/, "Teléfono de 7 a 15 dígitos").or(z.literal("")).optional(),

  userAddress: z.string().min(5, "La dirección es muy corta").max(150, "Demasiado larga"),

  userAccountType: z.string().min(1, "Seleccione el tipo de cuenta"),

  groupId: z.string().min(1, "Seleccione un grupo"),
};

const institucionalDistinto = (d) =>
  !d.userEmailInstitutional || d.userEmailInstitutional !== d.userEmail;

export const userSchema = z
  .object({
    ...campos,

    // (p48) Tratamiento de datos personales (Ley 1581 de 2012). Sin aceptar no
    // se crea el usuario: el backend lo exige con `valid(true)`.
    dataPolicyAccepted: z.boolean(),

    userPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[a-z]/, "Al menos una minúscula")
      .regex(/[0-9]/, "Al menos un número")
      .regex(/[^A-Za-z0-9]/, "Al menos un carácter especial"),
  })
  .refine(institucionalDistinto, {
    message: "El correo institucional no puede ser igual al personal",
    path: ["userEmailInstitutional"],
  })
  .superRefine((data, ctx) => {
    validarVigencia(data, ctx);
    if (!data.dataPolicyAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataPolicyAccepted"],
        message: "Debe aceptar el tratamiento de datos personales para crear el usuario",
      });
    }
  });

// Editar: sin contraseña (se cambia desde "Mi perfil" o recuperándola) y sin
// grupo (se gestiona en el módulo de accesos). Las fechas siguen siendo
// obligatorias porque el usuario ya las tiene y vaciarlas lo dejaría sin vigencia.
export const userUpdateSchema = z
  .object({
    userFirstName: campos.userFirstName,
    userLastName: campos.userLastName,
    documentTypeId: campos.documentTypeId,
    userDocumentNumber: campos.userDocumentNumber,
    userStartDate: campos.userStartDate,
    // Al editar NO se exige que la finalización sea futura: un usuario ya vencido
    // se sigue pudiendo corregir sin obligar a moverle la fecha.
    userEndDate: z
      .string()
      .min(1, "La fecha de finalización es obligatoria")
      .regex(FORMATO_FECHA, "Formato YYYY-MM-DD"),
    userEmail: campos.userEmail,
    userEmailInstitutional: campos.userEmailInstitutional,
    userPhone: campos.userPhone,
    userSecondPhone: campos.userSecondPhone,
    userAddress: campos.userAddress,
    userAccountType: campos.userAccountType,
  })
  .refine(institucionalDistinto, {
    message: "El correo institucional no puede ser igual al personal",
    path: ["userEmailInstitutional"],
  })
  .superRefine(validarVigencia);
