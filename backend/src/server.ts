import cors from "cors";
import "dotenv/config";
import express from "express";
import { router } from "./routes";
import { uploadsDir } from "./middleware/upload";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use("/api", router);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message ?? "Erro interno do servidor." });
});

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  console.log(`Diário de Obra API rodando em http://localhost:${port}`);
});
