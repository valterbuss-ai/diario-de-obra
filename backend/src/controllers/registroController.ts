import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { enviarRegistroParaPlanilha } from "../lib/n8nWebhook";

const createSchema = z.object({
  motoristaNome: z.string().min(3),
  placaId: z.coerce.number().int(),
  contratoId: z.coerce.number().int(),
  servicoId: z.coerce.number().int(),
  climaId: z.coerce.number().int(),
  usinaId: z.coerce.number().int(),
  numeroTicket: z.string().min(1),
  toneladas: z.coerce.number().positive(),
  rodoviaId: z.coerce.number().int(),
  km: z.coerce.number().nonnegative(),
  cidade: z.string().min(1),
  comprimento: z.coerce.number().positive(),
  largura: z.coerce.number().positive(),
  espessura: z.coerce.number().positive(),
  lado: z.enum(["direito", "esquerdo"]),
  observacoes: z.string().optional().nullable(),
  status: z.enum(["rascunho", "enviado"]).optional(),
});

type UploadedFiles = Record<string, Express.Multer.File[]>;

function fileUrl(file?: Express.Multer.File) {
  return file ? `/uploads/${file.filename}` : null;
}

const statusFilterSchema = z.enum(["rascunho", "enviado"]).optional();

export const registroController = {
  list: async (req: Request, res: Response) => {
    const statusFilter = statusFilterSchema.safeParse(req.query.status);
    const registros = await prisma.registro.findMany({
      where: statusFilter.success && statusFilter.data ? { status: statusFilter.data } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        motorista: true,
        placa: true,
        contrato: true,
        servico: true,
        clima: true,
        usina: true,
        rodovia: true,
        fotos: true,
        usuario: { select: { id: true, nome: true, perfil: true } },
      },
    });
    res.json(registros);
  },

  get: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const registro = await prisma.registro.findUnique({
      where: { id },
      include: {
        motorista: true,
        placa: true,
        contrato: true,
        servico: true,
        clima: true,
        usina: true,
        rodovia: true,
        fotos: true,
      },
    });
    if (!registro) return res.status(404).json({ message: "Registro não encontrado." });
    res.json(registro);
  },

  create: async (req: Request, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos.", issues: parsed.error.issues });
    }
    const data = parsed.data;
    const status = data.status ?? "enviado";

    const files = (req.files ?? {}) as UploadedFiles;
    const antes = files.antes?.[0];
    const durante = files.durante?.[0];
    const depois = files.depois?.[0];
    const trena = files.trena?.[0];
    const fotoTicket = files.fotoTicket?.[0];

    if (status === "enviado" && (!antes || !durante || !depois || !trena)) {
      return res.status(400).json({
        message: "As 4 fotos do serviço (antes, durante, depois e trena) são obrigatórias para finalizar o registro.",
      });
    }

    const [motorista, placa, contrato, servico, clima, usina, rodovia] = await Promise.all([
      prisma.motorista.findFirst({ where: { nome: { equals: data.motoristaNome, mode: "insensitive" } } }),
      prisma.placa.findUnique({ where: { id: data.placaId } }),
      prisma.contrato.findUnique({ where: { id: data.contratoId } }),
      prisma.servico.findUnique({ where: { id: data.servicoId } }),
      prisma.clima.findUnique({ where: { id: data.climaId } }),
      prisma.usina.findUnique({ where: { id: data.usinaId } }),
      prisma.rodovia.findUnique({ where: { id: data.rodoviaId } }),
    ]);

    if (!placa) return res.status(400).json({ message: "Placa inválida." });
    if (!contrato) return res.status(400).json({ message: "Contrato inválido." });
    if (!servico) return res.status(400).json({ message: "Serviço inválido." });
    if (!clima) return res.status(400).json({ message: "Clima inválido." });
    if (!usina) return res.status(400).json({ message: "Usina inválida." });
    if (!rodovia) return res.status(400).json({ message: "Rodovia inválida." });

    // Prestador terceirizado só pode usar placa/serviço marcados como de terceiros, e
    // vice-versa — evita registro internos "vazando" pra planilha com dados de placa/
    // serviço do perfil errado, mesmo que o front-end não tenha filtrado corretamente.
    const ehTerceirizado = req.user?.perfil === "terceirizado";
    const tipoEsperadoPlaca = ehTerceirizado ? "terceirizada" : "propria";
    const tipoEsperadoServico = ehTerceirizado ? "terceirizado" : "interno";
    if (placa.tipo !== tipoEsperadoPlaca) {
      return res.status(400).json({ message: "Esta placa não está disponível para o seu perfil." });
    }
    if (servico.tipo !== tipoEsperadoServico) {
      return res.status(400).json({ message: "Este serviço não está disponível para o seu perfil." });
    }

    const motoristaId = motorista
      ? motorista.id
      : (
          await prisma.motorista.create({
            data: { nome: data.motoristaNome, cpf: `PENDENTE-${Date.now()}`, cnh: "PENDENTE", status: "ativo" },
          })
        ).id;

    const registro = await prisma.registro.create({
      data: {
        motoristaId,
        placaId: data.placaId,
        contratoId: data.contratoId,
        servicoId: data.servicoId,
        climaId: data.climaId,
        usinaId: data.usinaId,
        numeroTicket: data.numeroTicket,
        toneladas: data.toneladas,
        fotoTicket: fileUrl(fotoTicket),
        rodoviaId: data.rodoviaId,
        km: data.km,
        cidade: data.cidade,
        comprimento: data.comprimento,
        largura: data.largura,
        espessura: data.espessura,
        lado: data.lado,
        observacoes: data.observacoes ?? null,
        status,
        usuarioId: req.user?.id ?? null,
        fotos: {
          create: [
            antes && { tipo: "antes" as const, arquivo: fileUrl(antes)! },
            durante && { tipo: "durante" as const, arquivo: fileUrl(durante)! },
            depois && { tipo: "depois" as const, arquivo: fileUrl(depois)! },
            trena && { tipo: "trena" as const, arquivo: fileUrl(trena)! },
          ].filter(Boolean) as { tipo: "antes" | "durante" | "depois" | "trena"; arquivo: string }[],
        },
      },
      include: {
        fotos: true,
        contrato: true,
        placa: true,
        servico: true,
        clima: true,
        usina: true,
        rodovia: true,
        usuario: { select: { id: true, nome: true, perfil: true } },
      },
    });

    res.status(201).json(registro);

    // Envio pra planilha do cliente via n8n. Fora do try/catch principal e sem await:
    // nunca deve atrasar nem derrubar a resposta 201 pro operador. Só dispara quando o
    // registro já nasce "enviado" (sem passar por rascunho); a função já trata e loga
    // erros internamente.
    if (status === "enviado") {
      enviarRegistroParaPlanilha(registro).catch(() => {});
    }
  },

  enviarLote: async (_req: Request, res: Response) => {
    const pendentes = await prisma.registro.findMany({
      where: { status: "rascunho" },
      include: { contrato: true, placa: true, servico: true, clima: true, usina: true, rodovia: true },
    });

    const resultado = await prisma.registro.updateMany({
      where: { status: "rascunho" },
      data: { status: "enviado" },
    });

    res.json({ enviados: resultado.count });

    // Envio pra planilha do cliente via n8n, UM DE CADA VEZ (await sequencial, não em
    // paralelo). O fluxo n8n calcula "próxima linha vazia" lendo a planilha antes de
    // escrever; disparar vários ao mesmo tempo faz duas execuções calcularem a mesma
    // linha e colidirem na escrita (confirmado em teste: 504 do Graph + risco real de
    // uma sobrescrever a outra). Fora do fluxo de resposta: nunca atrasa nem falha o
    // "enviar tudo" do operador, que já recebeu a resposta acima.
    (async () => {
      for (const registro of pendentes) {
        await enviarRegistroParaPlanilha(registro);
      }
    })();
  },
};
