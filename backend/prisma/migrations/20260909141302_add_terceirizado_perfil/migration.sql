-- CreateEnum
CREATE TYPE "TipoPlaca" AS ENUM ('propria', 'terceirizada');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('interno', 'terceirizado');

-- AlterEnum
ALTER TYPE "PerfilUsuario" ADD VALUE 'terceirizado';

-- AlterTable
ALTER TABLE "placas" ADD COLUMN     "tipo" "TipoPlaca" NOT NULL DEFAULT 'propria';

-- AlterTable
ALTER TABLE "registros" ADD COLUMN     "usuario_id" INTEGER;

-- AlterTable
ALTER TABLE "servicos" ADD COLUMN     "tipo" "TipoServico" NOT NULL DEFAULT 'interno';

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
