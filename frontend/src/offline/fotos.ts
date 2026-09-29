// Tratamento das fotos antes de guardar no celular.
//
// O app guardava direto o File vindo da câmera, que é apenas uma *referência* a um
// arquivo do sistema. Quando o aplicativo de câmera libera esse arquivo temporário,
// a referência quebra e a gravação no celular falha — foi o que tirou um registro
// inteiro do operador em campo. Aqui a foto vira uma cópia própria, em memória.

/** Cópia independente da foto, sem perder nada da imagem original. */
export async function copiaSegura(arquivo: Blob): Promise<Blob> {
  const dados = await arquivo.arrayBuffer();
  return new Blob([dados], { type: arquivo.type || "image/jpeg" });
}

/** Extensão do arquivo a partir do tipo, já que a cópia não tem mais o nome original. */
export function nomeDaFoto(campo: string, blob: Blob): string {
  if (blob.type === "image/png") return `${campo}.png`;
  if (blob.type === "image/webp") return `${campo}.webp`;
  return `${campo}.jpg`;
}

const LADO_MAXIMO = 1280;
const QUALIDADE = 0.75;

/**
 * Reduz a foto. Só é usada como rede de segurança, quando a foto no tamanho
 * original não coube no celular: perder um pouco de qualidade é muito melhor do
 * que o operador perder o registro em campo.
 *
 * imageOrientation "from-image" respeita a orientação gravada pela câmera; sem
 * isso, fotos tiradas de lado seriam salvas deitadas.
 */
export async function reduzir(foto: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(foto, { imageOrientation: "from-image" });
  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a imagem.");
    ctx.drawImage(bitmap, 0, 0, largura, altura);

    const menor = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALIDADE)
    );
    if (!menor) throw new Error("Não foi possível reduzir a imagem.");
    // Se por algum motivo a "redução" ficou maior, fica com a original.
    return menor.size < foto.size ? menor : foto;
  } finally {
    bitmap.close();
  }
}
