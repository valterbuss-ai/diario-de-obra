-- CreateEnum
CREATE TYPE "StatusAtivo" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "StatusAtivaUsina" AS ENUM ('ativa', 'inativa');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ativo', 'encerrado');

-- CreateEnum
CREATE TYPE "StatusRegistro" AS ENUM ('rascunho', 'enviado');

-- CreateEnum
CREATE TYPE "LadoPista" AS ENUM ('direito', 'esquerdo');

-- CreateEnum
CREATE TYPE "TipoFoto" AS ENUM ('antes', 'durante', 'depois', 'trena');

-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('operador', 'gestor', 'engenheiro');

-- CreateTable
CREATE TABLE "motoristas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placas" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "veiculo" TEXT NOT NULL,
    "capacidade" TEXT NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "vigencia_inicio" TIMESTAMP(3) NOT NULL,
    "vigencia_fim" TIMESTAMP(3) NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usinas" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "capacidade" TEXT NOT NULL,
    "status" "StatusAtivaUsina" NOT NULL DEFAULT 'ativa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rodovias" (
    "id" SERIAL NOT NULL,
    "rodovia" TEXT NOT NULL,
    "trecho" TEXT NOT NULL,
    "km_inicio" DECIMAL(65,30) NOT NULL,
    "km_fim" DECIMAL(65,30) NOT NULL,
    "cidade" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rodovias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "climas" (
    "id" SERIAL NOT NULL,
    "condicao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "climas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motorista_id" INTEGER NOT NULL,
    "placa_id" INTEGER NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "servico_id" INTEGER NOT NULL,
    "clima_id" INTEGER NOT NULL,
    "usina_id" INTEGER NOT NULL,
    "numero_ticket" TEXT NOT NULL,
    "toneladas" DECIMAL(65,30) NOT NULL,
    "foto_ticket" TEXT,
    "rodovia_id" INTEGER NOT NULL,
    "km" DECIMAL(65,30) NOT NULL,
    "cidade" TEXT NOT NULL,
    "comprimento" DECIMAL(65,30) NOT NULL,
    "largura" DECIMAL(65,30) NOT NULL,
    "espessura" DECIMAL(65,30) NOT NULL,
    "lado" "LadoPista" NOT NULL,
    "observacoes" TEXT,
    "status" "StatusRegistro" NOT NULL DEFAULT 'rascunho',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_fotos" (
    "id" SERIAL NOT NULL,
    "registro_id" INTEGER NOT NULL,
    "tipo" "TipoFoto" NOT NULL,
    "arquivo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "status" "StatusAtivo" NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_cpf_key" ON "motoristas"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "placas_placa_key" ON "placas"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_codigo_key" ON "contratos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "servicos_codigo_key" ON "servicos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motoristas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_placa_id_fkey" FOREIGN KEY ("placa_id") REFERENCES "placas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_clima_id_fkey" FOREIGN KEY ("clima_id") REFERENCES "climas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_usina_id_fkey" FOREIGN KEY ("usina_id") REFERENCES "usinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_rodovia_id_fkey" FOREIGN KEY ("rodovia_id") REFERENCES "rodovias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_fotos" ADD CONSTRAINT "registro_fotos_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
