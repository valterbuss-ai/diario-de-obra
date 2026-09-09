import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";

interface Crud {
  list: (req: any, res: any) => any;
  get: (req: any, res: any) => any;
  create: (req: any, res: any) => any;
  update: (req: any, res: any) => any;
  remove: (req: any, res: any) => any;
}

// Rotas de leitura ficam abertas a qualquer usuário autenticado (o app do
// operador precisa consultar motoristas/placas/contratos/etc.). Escrita é
// restrita ao perfil gestor, responsável pelos cadastros mestres.
export function crudRouter(controller: Crud): Router {
  const router = Router();

  router.get("/", authMiddleware, controller.list);
  router.get("/:id", authMiddleware, controller.get);
  router.post("/", authMiddleware, requireRole("gestor"), controller.create);
  router.put("/:id", authMiddleware, requireRole("gestor"), controller.update);
  router.delete("/:id", authMiddleware, requireRole("gestor"), controller.remove);

  return router;
}
