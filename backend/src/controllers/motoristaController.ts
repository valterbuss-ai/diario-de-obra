import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  nome: z.string().min(3),
  cpf: z.string().min(11),
  cnh: z.string().min(5),
  status: z.enum(["ativo", "inativo"]).optional(),
};

export const motoristaController = createCrudController({
  modelName: "motorista",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { nome: "asc" },
  uniqueFieldError: "Já existe um motorista com este CPF.",
});
