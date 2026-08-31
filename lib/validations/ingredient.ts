import { z } from "zod";

export const ingredientUnits = ["kg", "liter", "unit", "package", "can"] as const;
export type IngredientUnit = (typeof ingredientUnits)[number];

export const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  category: z
    .string()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null)),
  unit: z.enum(ingredientUnits, {
    errorMap: () => ({ message: "Unidad inválida" }),
  }),
  costPerUnit: z.coerce.number().positive("Debe ser mayor a 0"),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
