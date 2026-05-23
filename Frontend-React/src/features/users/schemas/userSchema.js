import { z } from "zod";

export const userSchema = z.object({

    userName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(60, "El nombre es demasiado largo"),

    userDocumentType: z
        .string()
        .min(1, "Debe seleccionar un tipo de documento"),

    userDocumentNumber: z
        .string()
        .min(5, "Número de documento inválido")
        .max(20, "Número de documento demasiado largo"),

    userPhone: z
        .string()
        .regex(/^[0-9]{10}$/, "El teléfono debe tener 10 dígitos"),

    userRole: z
        .string()
        .min(1, "Debe seleccionar un tipo de documento"),
    
    userEndDate: z
        .string()
        .min(1, "La fecha es obligatoria")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),

    userEmail: z
        .string()
        .email()
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido"),

    userEmailInstitutional: z
        .string()
        .email()
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email institucional válido"),

    userDirection: z
        .string()
        .min(5, "La dirección es muy corta")
        .max(100, "La dirección es demasiado larga"),

    userPassword: z
        .string()
        .min(8, "La contraseña debe tener mínimo 8 caracteres")
        .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
        .regex(/[a-z]/, "Debe contener al menos una minúscula")
        .regex(/[0-9]/, "Debe contener al menos un número")
        .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
       
});