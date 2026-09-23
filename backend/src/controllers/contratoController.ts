import { z } from "zod";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  codigo: z.string().min(3),
  orgao: z.string().min(2),
  descricao: z.string().min(3),
  tipoLocal: z.enum(["rodovia", "logradouro"]).optional(),
  // O formulário do admin manda todos os campos sempre, vazio quando não se
  // aplica: "" precisa virar nulo em vez de string vazia gravada no banco.
  municipio: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().min(2).nullable().optional()
  ),
  vigenciaInicio: z.coerce.date(),
  vigenciaFim: z.coerce.date(),
  status: z.enum(["ativo", "encerrado"]).optional(),
};

// Contrato de logradouro sem município deixaria todo registro dele sem cidade na
// planilha do cliente. Barra já no cadastro, e não na hora do operador salvar.
function exigeMunicipio(
  dados: { tipoLocal?: "rodovia" | "logradouro"; municipio?: string | null },
  ctx: z.RefinementCtx
) {
  if (dados.tipoLocal === "logradouro" && !dados.municipio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["municipio"],
      message: "Informe o município do contrato de logradouro.",
    });
  }
}

export const contratoController = createCrudController({
  modelName: "contrato",
  createSchema: z.object(baseSchema).superRefine(exigeMunicipio),
  updateSchema: z.object(baseSchema).partial().superRefine(exigeMunicipio),
  orderBy: { codigo: "asc" },
  uniqueFieldError: "Já existe um contrato com este código.",
});
