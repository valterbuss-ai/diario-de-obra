import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Insere (sem apagar nada existente) os dados mínimos de demonstração do
// perfil "prestador de serviço terceirizado": um login, uma placa e dois
// serviços de terceiros. Idempotente via upsert.
async function main() {
  const senha = await bcrypt.hash("terc123", 10);

  await prisma.usuario.upsert({
    where: { email: "terceirizado@obra.com" },
    update: {},
    create: {
      nome: "Prestador Terceirizado",
      email: "terceirizado@obra.com",
      senha,
      perfil: "terceirizado",
      status: "ativo",
    },
  });

  await prisma.placa.upsert({
    where: { placa: "TER-9K12" },
    update: {},
    create: {
      placa: "TER-9K12",
      veiculo: "Fiorino (prestador terceirizado)",
      capacidade: "0,65 t",
      tipo: "terceirizada",
      status: "ativo",
    },
  });

  await prisma.servico.upsert({
    where: { codigo: "TER-01" },
    update: {},
    create: { nome: "Instalação elétrica", codigo: "TER-01", tipo: "terceirizado", status: "ativo" },
  });
  await prisma.servico.upsert({
    where: { codigo: "TER-02" },
    update: {},
    create: { nome: "Topografia", codigo: "TER-02", tipo: "terceirizado", status: "ativo" },
  });

  console.log("Dados de demonstração do perfil terceirizado inseridos com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
