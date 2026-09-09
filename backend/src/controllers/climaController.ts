import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  condicao: z.string().min(2),
  icone: z.string().min(1),
  status: z.enum(["ativo", "inativo"]).optional(),
};

export const climaController = createCrudController({
  modelName: "clima",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { id: "asc" },
});
