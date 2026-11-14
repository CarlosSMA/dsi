export type UserRole = 'cidadao' | 'agente';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  role: UserRole;
  numero_matricula?: string;
  // Data de nascimento no formato ISO (AAAA-MM-DD).
  dataNascimento?: string;
  // Celular/WhatsApp, só os dígitos com DDD (10 ou 11).
  telefone?: string;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export interface AgenteMunicipal extends Usuario {
  numero_matricula: string;
}

export type StatusDenuncia = 'pendente' | 'em_analise' | 'confirmada' | 'descartada';

export interface Denuncia {
  id: string;
  id_denunciador: string;
  statusDenuncia: StatusDenuncia;
  localizacao: {
    latitude: number;
    longitude: number;
  };
  bairro: string;
  urlFoto?: string;
  dataCriacao: Date;
}

export type NivelRiscoEpidemiologico = 'baixo' | 'medio' | 'alto';

export type CategoriaNotificacao =
  | 'alerta_foco'
  | 'mutirao_saude'
  | 'caso_confirmado'
  | 'orientacao_sanitaria'
  | 'fumace_bloqueio';

export interface NotificacaoBairro {
  id: string;
  bairro: string;
  rpa: string;
  micro: string;
  categoria: CategoriaNotificacao;
  nivelRisco: NivelRiscoEpidemiologico;
  titulo: string;
  descricao: string;
  meta: string;
  dataIso: string;
  recomendacao?: string;
  casosRecentes?: number;
  indiceInfestacao?: string;
  badge?: string;
}

export interface ResumoBairroEpidemiologico {
  bairro: string;
  rpa: string;
  micro: string;
  nivelRisco: NivelRiscoEpidemiologico;
  totalAlertas: number;
  casosEstimados: number;
  indiceInfestacaoPredial: number; // ex: 4.2%
  temMutiraoAgendado: boolean;
  statusDescricao: string;
}
