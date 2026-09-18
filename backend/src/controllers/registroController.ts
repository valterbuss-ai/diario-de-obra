import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { enviarFoto, renomearItem } from "../lib/msGraph";
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
  lado: z.enum(["direito", "esquerdo", "ambos"]),
  observacoes: z.string().optional().nullable(),
  status: z.enum(["rascunho", "enviado"]).optional(),
  // Enviados pelo app: id gerado no celular (evita duplicar quando o envio é
  // repetido depois de ficar sem internet) e a hora em que o operador salvou.
  clienteId: z.string().uuid().optional(),
  data: z.coerce.date().optional(),
});

type UploadedFiles = Record<string, Express.Multer.File[]>;

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Caracteres que o SharePoint não aceita em nome de pasta/arquivo. */
function nomeSeguro(valor: string) {
  return valor.replace(/["*:<>?/\\|#%]/g, "-").replace(/\s+/g, " ").trim();
}

/** Ex: "CT-2024-091/2026/09 - Setembro/16" */
function pastaDoRegistro(codigoContrato: string, data: Date) {
  const mes = data.getMonth();
  return [
    nomeSeguro(codigoContrato),
    String(data.getFullYear()),
    `${String(mes + 1).padStart(2, "0")} - ${MESES[mes]}`,
    String(data.getDate()).padStart(2, "0"),
  ].join("/");
}

function extensaoDaFoto(file: Express.Multer.File) {
  const doNome = file.originalname.match(/\.[a-z0-9]+$/i);
  if (doNome) return doNome[0].toLowerCase();
  if (file.mimetype === "image/png") return ".png";
  if (file.mimetype === "image/webp") return ".webp";
  return ".jpg";
}

/**
 * Reserva `quantidade` números da sequência do mês (única para todos os contratos)
 * e devolve o primeiro da faixa. O INSERT ... ON CONFLICT é atômico: dois registros
 * salvos ao mesmo tempo nunca recebem o mesmo número.
 */
async function reservarNumerosDoMes(ano: number, mes: number, quantidade: number): Promise<number> {
  const linhas = await prisma.$queryRaw<{ proximo_numero: number }[]>`
    INSERT INTO contadores_foto_mensal (ano, mes, proximo_numero)
    VALUES (${ano}, ${mes}, ${quantidade})
    ON CONFLICT (ano, mes)
    DO UPDATE SET proximo_numero = contadores_foto_mensal.proximo_numero + ${quantidade}
    RETURNING proximo_numero
  `;
  const ultimo = Number(linhas[0].proximo_numero);
  return ultimo - quantidade + 1;
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

    // Reenvio de um registro que já chegou (ex: a resposta se perdeu por falta de
    // sinal e o celular tentou de novo): devolve o existente em vez de duplicar.
    if (data.clienteId) {
      const existente = await prisma.registro.findUnique({ where: { clienteId: data.clienteId }, include: { fotos: true } });
      if (existente) return res.status(200).json(existente);
    }

    const files = (req.files ?? {}) as UploadedFiles;
    const antes = files.antes?.[0];
    const durante = files.durante?.[0];
    const depois = files.depois?.[0];
    const trena = files.trena?.[0];
    const fotoTicket = files.fotoTicket?.[0];

    // Fotos do serviço são opcionais: nem todo serviço precisa das 4.
    const [motorista, placa, contrato, servico, clima, usina, rodovia] = await Promise.all([
      prisma.motorista.findFirst({ where: { nome: { equals: data.motoristaNome, mode: "insensitive" }, excluidoEm: null } }),
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

    // Fotos vão para o SharePoint do cliente, em
    // <CONTRATO>/<ANO>/<MÊS>/<DIA>/<número do mês>-<tipo>.<ext>. A foto do ticket
    // vai para a árvore separada "Tickets/..." (ver mais abaixo).
    const fotosRecebidas = [
      antes && { tipo: "antes" as const, file: antes },
      durante && { tipo: "durante" as const, file: durante },
      depois && { tipo: "depois" as const, file: depois },
      trena && { tipo: "trena" as const, file: trena },
    ].filter(Boolean) as { tipo: "antes" | "durante" | "depois" | "trena"; file: Express.Multer.File }[];

    const dataRegistro = data.data ?? new Date();
    let fotosParaCriar: { tipo: "antes" | "durante" | "depois" | "trena" | "ticket"; driveId: string; itemId: string }[] = [];

    if (fotosRecebidas.length > 0) {
      try {
        const pasta = pastaDoRegistro(contrato.codigo, dataRegistro);
        const prefixoTemporario = `tmp-${data.clienteId ?? Date.now()}`;

        // Sobe com nome temporário primeiro: assim um envio que falha não consome
        // números da sequência do mês (antes, a numeração ficava com buracos).
        const enviadas = await Promise.all(
          fotosRecebidas.map(async ({ tipo, file }) => {
            const extensao = extensaoDaFoto(file);
            const caminho = `${pasta}/${prefixoTemporario}-${tipo}${extensao}`;
            const { driveId, itemId } = await enviarFoto(caminho, file.buffer, file.mimetype);
            return { tipo, driveId, itemId, extensao };
          })
        );

        // Com todas as fotos no lugar, agora sim a numeração é consumida.
        const primeiroNumero = await reservarNumerosDoMes(
          dataRegistro.getFullYear(),
          dataRegistro.getMonth() + 1,
          enviadas.length
        );

        fotosParaCriar = await Promise.all(
          enviadas.map(async (foto, indice) => {
            const numero = String(primeiroNumero + indice).padStart(3, "0");
            // Se a renomeação falhar, a foto continua acessível (a exibição usa o
            // identificador do arquivo, não o nome) — só fica com o nome temporário.
            await renomearItem(foto.driveId, foto.itemId, `${numero}-${foto.tipo}${foto.extensao}`).catch((erroRename) =>
              console.error(`[registros] Não consegui renomear a foto ${foto.tipo} para ${numero}:`, erroRename)
            );
            return { tipo: foto.tipo, driveId: foto.driveId, itemId: foto.itemId };
          })
        );
      } catch (err) {
        console.error("[registros] Erro ao enviar fotos para o SharePoint:", err);
        // O motivo vai junto na resposta: sem acesso ao log do servidor, é a única
        // forma de saber se foi credencial, permissão ou indisponibilidade do Graph.
        const motivo = err instanceof Error ? err.message : String(err);
        return res.status(502).json({
          message: `Não foi possível guardar as fotos no SharePoint. O registro não foi salvo — tente de novo. (${motivo.slice(0, 300)})`,
        });
      }
    }

    // Foto do ticket: árvore separada, nome = número do ticket, e sem consumir
    // número da sequência mensal das fotos de serviço.
    if (fotoTicket) {
      try {
        const pastaTicket = `Tickets/${pastaDoRegistro(contrato.codigo, dataRegistro)}`;
        const caminho = `${pastaTicket}/${nomeSeguro(data.numeroTicket)}${extensaoDaFoto(fotoTicket)}`;
        const { driveId, itemId } = await enviarFoto(caminho, fotoTicket.buffer, fotoTicket.mimetype, {
          naoSobrescrever: true,
        });
        fotosParaCriar.push({ tipo: "ticket", driveId, itemId });
      } catch (err) {
        console.error("[registros] Erro ao enviar a foto do ticket para o SharePoint:", err);
        const motivo = err instanceof Error ? err.message : String(err);
        return res.status(502).json({
          message: `Não foi possível guardar a foto do ticket no SharePoint. O registro não foi salvo — tente de novo. (${motivo.slice(0, 300)})`,
        });
      }
    }

    // O motorista novo é cadastrado junto com o registro, na mesma transação.
    // Antes ele era criado antes do envio das fotos e ficava sozinho no cadastro
    // quando o envio falhava (foi assim que "Teste Integracao Fotos" apareceu).
    const registro = await prisma.$transaction(async (tx) => {
      const motoristaId = motorista
        ? motorista.id
        : (
            await tx.motorista.create({
              data: { nome: data.motoristaNome, cpf: `PENDENTE-${Date.now()}`, cnh: "PENDENTE", status: "ativo" },
            })
          ).id;

      return tx.registro.create({
        data: {
          motoristaId,
          placaId: data.placaId,
          contratoId: data.contratoId,
          servicoId: data.servicoId,
          climaId: data.climaId,
          usinaId: data.usinaId,
          numeroTicket: data.numeroTicket,
          toneladas: data.toneladas,
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
          clienteId: data.clienteId ?? null,
          data: data.data,
          fotos: { create: fotosParaCriar },
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
