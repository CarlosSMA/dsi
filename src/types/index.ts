export type UserRole = 'cidadao' | 'agente';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  role: UserRole;
  numero_matricula?: string;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export interface AgenteMunicipal extends Usuario {
  numero_matricula: string;
}

export type StatusDenuncia = 'pendente' | 'em_analise' | 'confirmada' | 'descartada';

export interface Denuncia {
  id?: string;
  id_denunciador: string; // Vinculo da sessao: quem enviou a foto
  id_revisor?: string;
  urlFoto: string;
  statusDenuncia: StatusDenuncia;
  bairro?: string;
  localizacao?: {
    latitude: number;
    longitude: number;
  };
  dataCriacao: Date;
}
