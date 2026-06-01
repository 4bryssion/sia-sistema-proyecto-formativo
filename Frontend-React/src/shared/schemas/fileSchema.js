import { z } from "zod";

const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
]

const MAX_SIZE = 10 * 10 * 1024;  // 10MB

export const fileSchema = z.object({
    files: z
        .array(
            z
                .instanceof(File)
                .refine((f) => ACCEPTED_TYPES.includes(f.type), "Tipo inválido")
                .refine((f) => f.size <= MAX_SIZE, "Máx 10MB"),
        )
        .min(1, "Requerido")
        .max(12, "Máx 12 archivos")
});