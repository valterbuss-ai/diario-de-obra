import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  numero: z.string().min(1),
  nome: z.string().min(2),
  capacidade: z.string().min(1),
  status: z.enum(["ativa", "inativa"]).optional(),
};

export const usinaController = createCrudController({
  modelName: "usina",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { numero: "asc" },
  uniqueFieldError: "Já existe uma usina com estes dados.",
});
