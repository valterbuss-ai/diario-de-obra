import multer from "multer";

// As fotos vão para o SharePoint do cliente (ver msGraph.ts), não para o disco:
// o servidor do Render é recriado a cada publicação e levava os arquivos junto.
// Por isso o arquivo fica em memória até ser enviado ao Graph.
const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      cb(new Error("Formato de imagem não suportado."));
      return;
    }
    cb(null, true);
  },
});
