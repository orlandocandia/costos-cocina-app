import { z } from "zod";

export const workplaceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  address: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  monthlyRent: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  monthlyElectricity: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  monthlyGas: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  monthlyWater: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  monthlyOther: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
});

export type WorkplaceInput = z.infer<typeof workplaceSchema>;
