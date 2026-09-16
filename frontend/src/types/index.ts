export type StatusAtivo = "ativo" | "inativo";
export type StatusAtivaUsina = "ativa" | "inativa";
export type StatusContrato = "ativo" | "encerrado";
export type StatusRegistro = "rascunho" | "enviado";
export type LadoPista = "direito" | "esquerdo";
export type TipoFoto = "antes" | "durante" | "depois" | "trena";
export type PerfilUsuario = "operador" | "gestor" | "engenheiro" | "terceirizado";
export type TipoPlaca = "propria" | "terceirizada";
export type TipoServico = "interno" | "terceirizado";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface Motorista {
  id: number;
  nome: string;
  cpf: string;
  cnh: string;
  status: StatusAtivo;
}

export interface Placa {
  id: number;
  placa: string;
  veiculo: string;
  capacidade: string;
  tipo: TipoPlaca;
  status: StatusAtivo;
}

export interface Contrato {
  id: number;
  codigo: string;
  orgao: string;
  descricao: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: StatusContrato;
}

export interface Servico {
  id: number;
  nome: string;
  codigo: string;
  tipo: TipoServico;
  status: StatusAtivo;
}

export interface Usina {
  id: number;
  numero: string;
  nome: string;
  capacidade: string;
  status: StatusAtivaUsina;
}

export interface Rodovia {
  id: number;
  rodovia: string;
  trecho: string;
  kmInicio: string;
  kmFim: string;
  cidade: string;
}

export interface Clima {
  id: number;
  condicao: string;
  icone: string;
  status: StatusAtivo;
}

export interface RegistroFoto {
  id: number;
  tipo: TipoFoto;
  // Local do arquivo no SharePoint; nulo nas fotos antigas, que se perderam.
  driveId: string | null;
  itemId: string | null;
}

export interface Registro {
  id: number;
  data: string;
  motorista: Motorista;
  placa: Placa;
  contrato: Contrato;
  servico: Servico;
  clima: Clima;
  usina: Usina;
  numeroTicket: string;
  toneladas: string;
  fotoTicket: string | null;
  rodovia: Rodovia;
  km: string;
  cidade: string;
  comprimento: string;
  largura: string;
  espessura: string;
  lado: LadoPista;
  observacoes: string | null;
  status: StatusRegistro;
  fotos: RegistroFoto[];
  usuario: { id: number; nome: string; perfil: PerfilUsuario } | null;
  createdAt: string;
}

export interface DashboardResumo {
  motoristas: number;
  placas: number;
  contratos: number;
  servicos: number;
  usinas: number;
  rodovias: number;
  climas: number;
  registros: number;
}
