import { z } from "zod";

// Fecha de hoy LOCAL en YYYY-MM-DD; se compara como string contra el input type="date"
// (evita el bug de zona horaria de new Date("YYYY-MM-DD"), que parsea en UTC)
export const todayLocalISO = () => new Date().toLocaleDateString("en-CA");

export const userSchema = z
  .object({
    userFirstName: z.string().min(3, "El nombre debe tener mínimo 3 caracteres").max(100, "Demasiado largo"),

    userLastName: z.string().min(3, "El apellido debe tener mínimo 3 caracteres").max(100, "Demasiado largo"),

    documentTypeId: z.string().min(1, "Seleccione un tipo de documento"),

    userDocumentNumber: z.string().min(5, "Número inválido").max(20, "Demasiado largo"),

    // Instructor de planta / administrador: la fecha de finalización es OPCIONAL.
    // La obligatoriedad se valida en el refine final según isStaffInstructor.
    isStaffInstructor: z.boolean().optional(),

    userEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
      // Hoy es válido; anteriores no
      .refine((v) => v >= todayLocalISO(), "La fecha de finalización no puede ser anterior a hoy")
      .or(z.literal("")),

    userEmail: z.string().email("Correo personal inválido"),

    userEmailInstitutional: z.string().email("Correo institucional inválido").or(z.literal("")).optional(),

    userPhone: z.string().regex(/^[0-9]{7,15}$/, "Teléfono de 7 a 15 dígitos"),
    userSecondPhone: z.string().regex(/^[0-9]{7,15}$/, "Teléfono de 7 a 15 dígitos").or(z.literal("")).optional(),

    userAddress: z.string().min(5, "La dirección es muy corta").max(150, "Demasiado larga"),

    userAccountType: z.string().min(1, "Seleccione el tipo de cuenta"),

    groupId: z.string().min(1, "Seleccione un grupo"),
    
    userPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[a-z]/, "Al menos una minúscula")
      .regex(/[0-9]/, "Al menos un número")
      .regex(/[^A-Za-z0-9]/, "Al menos un carácter especial"),
  })
  .refine(
    (d) => !d.userEmailInstitutional || d.userEmailInstitutional !== d.userEmail,
    { message: "El correo institucional no puede ser igual al personal", path: ["userEmailInstitutional"] }
  )
  // Solo es obligatoria si NO es instructor de planta
  .refine((d) => d.isStaffInstructor || (d.userEndDate && d.userEndDate !== ""), {
    message: "La fecha es obligatoria",
    path: ["userEndDate"],
  });
