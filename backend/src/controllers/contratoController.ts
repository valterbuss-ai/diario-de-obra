import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  codigo: z.string().min(3),
  orgao: z.string().min(2),
  descricao: z.string().min(3),
  vigenciaInicio: z.coerce.date(),
  vigenciaFim: z.coerce.date(),
  status: z.enum(["ativo", "encerrado"]).optional(),
};

export const contratoController = createCrudController({
  modelName: "contrato",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { codigo: "asc" },
  uniqueFieldError: "Já existe um contrato com este código.",
});
