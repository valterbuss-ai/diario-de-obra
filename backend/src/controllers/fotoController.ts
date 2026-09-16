import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { baixarFoto } from "../lib/msGraph";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "troque-este-segredo-em-producao";

// A foto é aberta por link direto (<a href> / <img src>), que não manda cabeçalho
// de autenticação. Por isso aqui o token também é aceito pela URL (?token=).
function autenticado(req: Request): boolean {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : (req.query.token as string | undefined);
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export const fotoController = {
  mostrar: async (req: Request, res: Response) => {
    if (!autenticado(req)) {
      return res.status(401).json({ message: "Token não informado ou inválido." });
    }

    const id = Number(req.params.id);
    const foto = await prisma.registroFoto.findUnique({ where: { id } });
    if (!foto) return res.status(404).json({ message: "Foto não encontrada." });

    // Fotos antigas, de antes da mudança para o SharePoint: o arquivo se perdeu
    // junto com o disco do servidor e não há como recuperar.
    if (!foto.driveId || !foto.itemId) {
      return res.status(404).json({ message: "Esta foto não está mais disponível (enviada antes do arquivamento no SharePoint)." });
    }

    try {
      const graphRes = await baixarFoto(foto.driveId, foto.itemId);
      if (!graphRes.ok || !graphRes.body) {
        return res.status(404).json({ message: "Não foi possível abrir a foto no SharePoint." });
      }

      res.setHeader("Content-Type", graphRes.headers.get("content-type") ?? "image/jpeg");
      res.setHeader("Cache-Control", "private, max-age=300");
      const buffer = Buffer.from(await graphRes.arrayBuffer());
      res.send(buffer);
    } catch (err) {
      console.error(`[fotos] Erro ao buscar a foto ${id} no SharePoint:`, err);
      res.status(502).json({ message: "Não foi possível abrir a foto agora. Tente de novo." });
    }
  },
};
