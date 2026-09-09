import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createCrudController } from "./crudFactory";

const baseSchema = {
  rodovia: z.string().min(2),
  trecho: z.string().min(2),
  kmInicio: z.coerce.number(),
  kmFim: z.coerce.number(),
  cidade: z.string().min(2),
};

const crud = createCrudController({
  modelName: "rodovia",
  createSchema: z.object(baseSchema),
  updateSchema: z.object(baseSchema).partial(),
  orderBy: { rodovia: "asc" },
});

const lookupSchema = z.object({
  rodovia: z.string().min(1),
  km: z.coerce.number(),
});

export const rodoviaController = {
  ...crud,

  // Nomes distintos de rodovias cadastradas, para popular o dropdown do operador.
  opcoes: async (_req: Request, res: Response) => {
    const rodovias = await prisma.rodovia.findMany({
      distinct: ["rodovia"],
      select: { rodovia: true },
      orderBy: { rodovia: "asc" },
    });
    res.json(rodovias.map((r) => r.rodovia));
  },

  // Resolve a cidade automaticamente a partir da rodovia + km informados.
  lookup: async (req: Request, res: Response) => {
    const parsed = lookupSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Informe rodovia e km válidos." });
    }
    const { rodovia, km } = parsed.data;

    const trecho = await prisma.rodovia.findFirst({
      where: { rodovia, kmInicio: { lte: km }, kmFim: { gte: km } },
    });

    if (!trecho) {
      return res.status(404).json({ message: "Trecho não localizado." });
    }

    res.json({ rodoviaId: trecho.id, cidade: trecho.cidade, trecho: trecho.trecho });
  },
};
