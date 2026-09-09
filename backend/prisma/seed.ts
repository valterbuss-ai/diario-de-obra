import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.registroFoto.deleteMany();
  await prisma.registro.deleteMany();
  await prisma.motorista.deleteMany();
  await prisma.placa.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.usina.deleteMany();
  await prisma.rodovia.deleteMany();
  await prisma.clima.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.motorista.createMany({
    data: [
      { nome: "José Carlos da Silva", cpf: "111.111.111-11", cnh: "12345678901", status: "ativo" },
      { nome: "Marcos Roberto Pereira", cpf: "222.222.222-22", cnh: "23456789012", status: "ativo" },
      { nome: "Anderson Luiz Müller", cpf: "333.333.333-33", cnh: "34567890123", status: "ativo" },
      { nome: "Fernando Souza Lima", cpf: "444.444.444-44", cnh: "45678901234", status: "inativo" },
    ],
  });

  await prisma.placa.createMany({
    data: [
      { placa: "MFN-4J21", veiculo: "Volvo FH 540", capacidade: "32 t", tipo: "propria", status: "ativo" },
      { placa: "QRA-8B45", veiculo: "Scania R450", capacidade: "28 t", tipo: "propria", status: "ativo" },
      { placa: "KWD-2E18", veiculo: "Mercedes Actros 2651", capacidade: "30 t", tipo: "propria", status: "ativo" },
      { placa: "JHT-7A33", veiculo: "Volvo VM 330", capacidade: "24 t", tipo: "propria", status: "inativo" },
      { placa: "TER-9K12", veiculo: "Fiorino (prestador terceirizado)", capacidade: "0,65 t", tipo: "terceirizada", status: "ativo" },
    ],
  });

  await prisma.contrato.createMany({
    data: [
      {
        codigo: "CT-2024-137",
        orgao: "DER/SC",
        descricao: "BR-280 trecho Jaraguá do Sul — Guaramirim",
        vigenciaInicio: new Date("2024-01-01"),
        vigenciaFim: new Date("2026-12-31"),
        status: "ativo",
      },
      {
        codigo: "CT-2024-091",
        orgao: "DNIT",
        descricao: "BR-101 trecho norte de Santa Catarina",
        vigenciaInicio: new Date("2024-03-01"),
        vigenciaFim: new Date("2026-06-30"),
        status: "ativo",
      },
      {
        codigo: "CT-2023-208",
        orgao: "Prefeitura",
        descricao: "Anel Viário Municipal",
        vigenciaInicio: new Date("2023-05-01"),
        vigenciaFim: new Date("2025-04-30"),
        status: "ativo",
      },
    ],
  });

  await prisma.servico.createMany({
    data: [
      { nome: "Tapa-buraco", codigo: "SRV-01", tipo: "interno", status: "ativo" },
      { nome: "Recapeamento", codigo: "SRV-02", tipo: "interno", status: "ativo" },
      { nome: "Microrrevestimento", codigo: "SRV-03", tipo: "interno", status: "ativo" },
      { nome: "Remendo profundo", codigo: "SRV-04", tipo: "interno", status: "ativo" },
      { nome: "Instalação elétrica", codigo: "TER-01", tipo: "terceirizado", status: "ativo" },
      { nome: "Topografia", codigo: "TER-02", tipo: "terceirizado", status: "ativo" },
    ],
  });

  await prisma.usina.createMany({
    data: [
      { numero: "01", nome: "Usina Joinville", capacidade: "120 t/h", status: "ativa" },
      { numero: "02", nome: "Usina Araquari", capacidade: "100 t/h", status: "ativa" },
      { numero: "03", nome: "Usina Navegantes", capacidade: "80 t/h", status: "ativa" },
      { numero: "04", nome: "Usina Jaraguá do Sul", capacidade: "110 t/h", status: "ativa" },
    ],
  });

  await prisma.rodovia.createMany({
    data: [
      { rodovia: "BR-280", trecho: "Jaraguá do Sul — Guaramirim", kmInicio: 60, kmFim: 70, cidade: "Jaraguá do Sul" },
      { rodovia: "BR-280", trecho: "Guaramirim — Schroeder", kmInicio: 50, kmFim: 60, cidade: "Guaramirim" },
      { rodovia: "BR-280", trecho: "Schroeder — Corupá", kmInicio: 40, kmFim: 50, cidade: "Schroeder" },
      { rodovia: "BR-101", trecho: "Piçarras", kmInicio: 180, kmFim: 200, cidade: "Piçarras" },
      { rodovia: "BR-101", trecho: "Barra Velha", kmInicio: 200, kmFim: 215, cidade: "Barra Velha" },
      { rodovia: "SC-301", trecho: "Corupá", kmInicio: 0, kmFim: 30, cidade: "Corupá" },
      { rodovia: "SC-413", trecho: "Massaranduba", kmInicio: 0, kmFim: 20, cidade: "Massaranduba" },
    ],
  });

  await prisma.clima.createMany({
    data: [
      { condicao: "Ensolarado", icone: "☀️", status: "ativo" },
      { condicao: "Parcialmente nublado", icone: "⛅", status: "ativo" },
      { condicao: "Nublado", icone: "☁️", status: "ativo" },
      { condicao: "Chuvoso", icone: "🌧️", status: "ativo" },
      { condicao: "Tempestade", icone: "⛈️", status: "ativo" },
    ],
  });

  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaOperador = await bcrypt.hash("op123", 10);
  const senhaEngenheiro = await bcrypt.hash("eng123", 10);
  const senhaTerceirizado = await bcrypt.hash("terc123", 10);

  await prisma.usuario.createMany({
    data: [
      { nome: "Administrador", email: "admin@obra.com", senha: senhaAdmin, perfil: "gestor", status: "ativo" },
      { nome: "Operador de Campo", email: "operador@obra.com", senha: senhaOperador, perfil: "operador", status: "ativo" },
      { nome: "Engenheiro Responsável", email: "engenheiro@obra.com", senha: senhaEngenheiro, perfil: "engenheiro", status: "ativo" },
      { nome: "Prestador Terceirizado", email: "terceirizado@obra.com", senha: senhaTerceirizado, perfil: "terceirizado", status: "ativo" },
    ],
  });

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
