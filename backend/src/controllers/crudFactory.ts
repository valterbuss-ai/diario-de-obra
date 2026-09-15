import { Request, Response } from "express";
import { ZodSchema } from "zod";
import { prisma } from "../lib/prisma";

type PrismaDelegate = {
  findMany: (args?: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

interface CrudOptions {
  modelName: string;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  orderBy?: Record<string, "asc" | "desc">;
  uniqueFieldError?: string;
  // Restringe o list() a um subconjunto fixo (ex: mesma tabela "servico"
  // compartilhada entre a lista de serviços internos e a de terceiros,
  // diferenciadas por um campo "tipo").
  listWhere?: Record<string, any>;
  // Campos fixos aplicados a toda criação, além do que vier no body (ex:
  // forçar tipo: "terceirizado" nesse controller, mesmo que o form não envie).
  createDefaults?: Record<string, any>;
}

export function createCrudController({
  modelName,
  createSchema,
  updateSchema,
  orderBy,
  uniqueFieldError,
  listWhere,
  createDefaults,
}: CrudOptions) {
  const delegate = (prisma as unknown as Record<string, PrismaDelegate>)[modelName];

  return {
    list: async (_req: Request, res: Response) => {
      const items = await delegate.findMany({ where: { ...listWhere, excluidoEm: null }, orderBy: orderBy ?? { id: "asc" } });
      res.json(items);
    },

    get: async (req: Request, res: Response) => {
      const id = Number(req.params.id);
      const item = await delegate.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ message: "Registro não encontrado." });
      res.json(item);
    },

    create: async (req: Request, res: Response) => {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos.", issues: parsed.error.issues });
      }
      try {
        const item = await delegate.create({ data: { ...parsed.data, ...createDefaults } });
        res.status(201).json(item);
      } catch (err: any) {
        if (err.code === "P2002") {
          return res.status(409).json({ message: uniqueFieldError ?? "Registro já existente com este valor único." });
        }
        throw err;
      }
    },

    update: async (req: Request, res: Response) => {
      const id = Number(req.params.id);
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos.", issues: parsed.error.issues });
      }
      try {
        const item = await delegate.update({ where: { id }, data: parsed.data });
        res.json(item);
      } catch (err: any) {
        if (err.code === "P2025") {
          return res.status(404).json({ message: "Registro não encontrado." });
        }
        if (err.code === "P2002") {
          return res.status(409).json({ message: uniqueFieldError ?? "Registro já existente com este valor único." });
        }
        throw err;
      }
    },

    remove: async (req: Request, res: Response) => {
      const id = Number(req.params.id);
      try {
        const item = await delegate.findUnique({ where: { id } });
        if (!item || item.excluidoEm) {
          return res.status(404).json({ message: "Registro não encontrado." });
        }

        // Todos os cadastros mestres são referenciados por registros de obra
        // (ex: modelName "usina" -> registro.usinaId). Se já foi usado, apagar de
        // verdade quebraria o histórico e o que já foi pra planilha do cliente,
        // então só marca como excluído e some das listas. Conferido antes de
        // tentar apagar, em vez de depender do código de erro do banco.
        const usos = await prisma.registro.count({ where: { [`${modelName}Id`]: id } });
        if (usos > 0) {
          await delegate.update({ where: { id }, data: { excluidoEm: new Date() } });
        } else {
          await delegate.delete({ where: { id } });
        }
        res.status(204).send();
      } catch (err: any) {
        // Express 4 não captura erro de handler async: sem este retorno a
        // requisição ficava pendurada e o admin só via uma mensagem genérica.
        console.error(`[crud:${modelName}] Erro ao excluir id ${id}:`, err);
        res.status(500).json({ message: `Não foi possível excluir: ${err.code ?? ""} ${err.message ?? ""}`.trim() });
      }
    },
  };
}
