import { z } from "zod";
import { createCrudController } from "./crudFactory";

// Compartilha a tabela "servico" com o servicoController — a lista de
// serviços disponíveis para prestadores terceirizados é o mesmo cadastro,
// só filtrado/criado com tipo: "terceirizado" em vez de "interno".
const baseSchema = {
  nome: z.string().min(2),
  codigo: z.string().min(2),
  status: z.enum(["ativo", "inativo"]).optional(),
};

export const servicoTerceiroController = createCrudController({
  modelName: "servico",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { codigo: "asc" },
  uniqueFieldError: "Já existe um serviço de terceiros com este código.",
  listWhere: { tipo: "terceirizado" },
  createDefaults: { tipo: "terceirizado" },
});
