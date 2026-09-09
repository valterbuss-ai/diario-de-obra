import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  placa: z.string().min(5),
  veiculo: z.string().min(2),
  capacidade: z.string().min(1),
  tipo: z.enum(["propria", "terceirizada"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
};

export const placaController = createCrudController({
  modelName: "placa",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { placa: "asc" },
  uniqueFieldError: "Já existe uma placa cadastrada com este valor.",
});
