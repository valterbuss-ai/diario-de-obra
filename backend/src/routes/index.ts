import { Router } from "express";
import { authController } from "../controllers/authController";
import { climaController } from "../controllers/climaController";
import { contratoController } from "../controllers/contratoController";
import { motoristaController } from "../controllers/motoristaController";
import { placaController } from "../controllers/placaController";
import { registroController } from "../controllers/registroController";
import { rodoviaController } from "../controllers/rodoviaController";
import { servicoController } from "../controllers/servicoController";
import { servicoTerceiroController } from "../controllers/servicoTerceiroController";
import { usinaController } from "../controllers/usinaController";
import { authMiddleware } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { prisma } from "../lib/prisma";
import { crudRouter } from "./crudRouter";

export const router = Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);

router.use("/motoristas", crudRouter(motoristaController));
router.use("/placas", crudRouter(placaController));
router.use("/contratos", crudRouter(contratoController));
router.use("/servicos", crudRouter(servicoController));
router.use("/servicos-terceiros", crudRouter(servicoTerceiroController));
router.use("/usinas", crudRouter(usinaController));
router.use("/climas", crudRouter(climaController));

router.get("/rodovias/opcoes", authMiddleware, rodoviaController.opcoes);
router.get("/rodovias/lookup", authMiddleware, rodoviaController.lookup);
router.use("/rodovias", crudRouter(rodoviaController));

router.get("/registros", authMiddleware, registroController.list);
router.post("/registros/enviar-lote", authMiddleware, registroController.enviarLote);
router.get("/registros/:id", authMiddleware, registroController.get);
router.post(
  "/registros",
  authMiddleware,
  upload.fields([
    { name: "fotoTicket", maxCount: 1 },
    { name: "antes", maxCount: 1 },
    { name: "durante", maxCount: 1 },
    { name: "depois", maxCount: 1 },
    { name: "trena", maxCount: 1 },
  ]),
  registroController.create
);

router.get("/dashboard/resumo", authMiddleware, async (_req, res) => {
  const [motoristas, placas, contratos, servicos, usinas, rodovias, climas, registros] = await Promise.all([
    prisma.motorista.count({ where: { excluidoEm: null } }),
    prisma.placa.count({ where: { excluidoEm: null } }),
    prisma.contrato.count({ where: { excluidoEm: null } }),
    prisma.servico.count({ where: { excluidoEm: null } }),
    prisma.usina.count({ where: { excluidoEm: null } }),
    prisma.rodovia.count({ where: { excluidoEm: null } }),
    prisma.clima.count({ where: { excluidoEm: null } }),
    prisma.registro.count(),
  ]);
  res.json({ motoristas, placas, contratos, servicos, usinas, rodovias, climas, registros });
});
