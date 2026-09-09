import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  nome: z.string().min(2),
  codigo: z.string().min(2),
  status: z.enum(["ativo", "inativo"]).optional(),
};

export const servicoController = createCrudController({
  modelName: "servico",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { codigo: "asc" },
  uniqueFieldError: "Já existe um serviço com este código.",
  // Esta lista mostra e cria só os serviços internos; a lista de serviços de
  // terceiros (servicoTerceiroController) usa a MESMA tabela, diferenciada
  // pelo campo "tipo".
  listWhere: { tipo: "interno" },
  createDefaults: { tipo: "interno" },
});
