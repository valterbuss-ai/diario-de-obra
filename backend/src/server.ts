import cors from "cors";
import "dotenv/config";
import express from "express";
import { router } from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message ?? "Erro interno do servidor." });
});

// O Express 4 não encaminha erros de função assíncrona para o tratador acima: eles
// viravam "unhandled rejection" e o Node encerrava o processo. Na prática, um erro
// em um único pedido tirava o sistema do ar para todos os operadores em campo até o
// Render reiniciar — e o celular ficava sem resposta, reenviando o mesmo registro
// em laço. Manter o servidor de pé é sempre melhor que derrubá-lo.
process.on("unhandledRejection", (motivo) => {
  console.error("[servidor] Falha assíncrona não tratada (o servidor segue no ar):", motivo);
});
process.on("uncaughtException", (erro) => {
  console.error("[servidor] Erro não tratado (o servidor segue no ar):", erro);
});

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  console.log(`Diário de Obra API rodando em http://localhost:${port}`);
});
