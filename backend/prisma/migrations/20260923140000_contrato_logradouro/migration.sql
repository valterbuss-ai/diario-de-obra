-- Contratos de prefeitura são executados em área urbana: não existe rodovia nem km.
-- O admin marca o contrato como "de logradouro" e informa o município uma única vez;
-- o operador passa a digitar só o logradouro. Na planilha do cliente o logradouro
-- ocupa a mesma coluna E ("RODOVIA / LOGRADOURO") e as colunas de km (G e H) ficam
-- em branco — por isso rodovia_id e km precisam aceitar nulo.
--
-- Nenhum dado existente muda: todo contrato nasce 'rodovia' pelo DEFAULT e todo
-- registro já gravado mantém sua rodovia e seu km.

-- CreateEnum
CREATE TYPE "TipoLocalContrato" AS ENUM ('rodovia', 'logradouro');

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN "tipo_local" "TipoLocalContrato" NOT NULL DEFAULT 'rodovia';
ALTER TABLE "contratos" ADD COLUMN "municipio" TEXT;

-- AlterTable
ALTER TABLE "registros" ADD COLUMN "logradouro" TEXT;
ALTER TABLE "registros" ALTER COLUMN "rodovia_id" DROP NOT NULL;
ALTER TABLE "registros" ALTER COLUMN "km" DROP NOT NULL;
