-- As fotos passam a ficar na biblioteca "Fotos do Sistema" do SharePoint do cliente,
-- em vez do disco do servidor (que some a cada publicação no Render).
-- O caminho local antigo é substituído pelo par drive_id + item_id do Graph.
ALTER TABLE "registro_fotos" DROP COLUMN "arquivo";
ALTER TABLE "registro_fotos" ADD COLUMN "drive_id" TEXT;
ALTER TABLE "registro_fotos" ADD COLUMN "item_id" TEXT;

-- Numeração das fotos: sequência única por mês, somando todos os contratos.
CREATE TABLE "contadores_foto_mensal" (
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "proximo_numero" INTEGER NOT NULL,
  CONSTRAINT "contadores_foto_mensal_pkey" PRIMARY KEY ("ano", "mes")
);
