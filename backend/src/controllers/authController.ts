import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../middleware/auth";

// O celular costuma pôr a primeira letra em maiúscula ou deixar um espaço no fim do
// e-mail sem o usuário perceber; por isso o e-mail é normalizado antes de validar.
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});

export const authController = {
  login: async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Informe email e senha válidos." });
    }
    const { email, senha } = parsed.data;

    // Cadastros antigos podem ter maiúsculas no e-mail, então a busca ignora a caixa.
    const usuario = await prisma.usuario.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!usuario || usuario.status !== "ativo") {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = signToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });
  },

  me: async (req: Request, res: Response) => {
    res.json({ usuario: req.user });
  },
};
