import type { Denuncia as IDenuncia, StatusDenuncia } from '@/src/types';

export interface LocalizacaoCoords {
  latitude: number;
  longitude: number;
}

/**
 * Classe de Domínio: Denuncia
 * 
 * Implementa os princípios de Programação Orientada a Objetos (POO):
 * - Encapsulamento dos atributos de ocorrência sanitária;
 * - Suporte a múltiplas fotos do foco (carrossel) com compatibilidade retroativa;
 * - Métodos de negócio para validação, formatação e verificação de ciclo de vida.
 */
export class DenunciaModel implements IDenuncia {
  public id: string;
  public id_denunciador: string;
  public id_revisor?: string;
  public statusDenuncia: StatusDenuncia;
  public localizacao: LocalizacaoCoords;
  public bairro: string;
  public urlFoto?: string;
  public urlsFotos: string[];
  public dataCriacao: Date;

  constructor(dados: {
    id: string;
    id_denunciador: string;
    id_revisor?: string;
    statusDenuncia: StatusDenuncia;
    localizacao: LocalizacaoCoords;
    bairro: string;
    urlFoto?: string;
    urlsFotos?: string[];
    dataCriacao?: Date;
  }) {
    this.id = dados.id;
    this.id_denunciador = dados.id_denunciador;
    this.id_revisor = dados.id_revisor;
    this.statusDenuncia = dados.statusDenuncia;
    this.localizacao = dados.localizacao;
    this.bairro = dados.bairro.trim();
    this.dataCriacao = dados.dataCriacao || new Date();

    // Normalização das fotos para suportar tanto array múltiplo quanto foto única legada
    if (Array.isArray(dados.urlsFotos) && dados.urlsFotos.length > 0) {
      this.urlsFotos = dados.urlsFotos.filter((u) => typeof u === 'string' && u.trim().length > 0);
      this.urlFoto = this.urlsFotos[0];
    } else if (typeof dados.urlFoto === 'string' && dados.urlFoto.trim().length > 0) {
      this.urlsFotos = [dados.urlFoto.trim()];
      this.urlFoto = dados.urlFoto.trim();
    } else {
      this.urlsFotos = [];
      this.urlFoto = undefined;
    }
  }

  /**
   * Retorna a lista de todas as fotos anexadas à ocorrência.
   */
  public get fotos(): string[] {
    return this.urlsFotos;
  }

  /**
   * Retorna a primeira foto (foto de capa/principal da denúncia).
   */
  public get fotoPrincipal(): string | undefined {
    return this.urlsFotos[0] || this.urlFoto;
  }

  /**
   * Quantidade total de fotos registradas no carrossel.
   */
  public get totalFotos(): number {
    return this.urlsFotos.length;
  }

  /**
   * Verifica se há mais de uma imagem anexada (para renderização de carrossel).
   */
  public temMultiplasFotos(): boolean {
    return this.urlsFotos.length > 1;
  }

  public estaPendente(): boolean {
    return this.statusDenuncia === 'pendente';
  }

  public estaConfirmada(): boolean {
    return this.statusDenuncia === 'confirmada';
  }

  public estaRejeitada(): boolean {
    return this.statusDenuncia === 'rejeitada';
  }

  /**
   * Adiciona uma nova foto à lista do carrossel da denúncia.
   */
  public adicionarFoto(url: string): void {
    if (url && typeof url === 'string' && url.trim().length > 0) {
      this.urlsFotos.push(url.trim());
      if (!this.urlFoto) {
        this.urlFoto = url.trim();
      }
    }
  }

  /**
   * Remove uma foto pelo índice.
   */
  public removerFoto(index: number): boolean {
    if (index >= 0 && index < this.urlsFotos.length) {
      this.urlsFotos.splice(index, 1);
      this.urlFoto = this.urlsFotos[0] || undefined;
      return true;
    }
    return false;
  }

  /**
   * Formata a data de criação no padrão legível brasileiro.
   */
  public formatarDataCriacao(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(this.dataCriacao);
  }

  /**
   * Valida as regras de integridade do domínio antes da persistência.
   */
  public validar(): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!this.id_denunciador) {
      erros.push('O denunciador deve estar autenticado.');
    }
    if (!this.bairro || this.bairro.trim().length < 2) {
      erros.push('O bairro da ocorrência é obrigatório.');
    }
    if (!this.localizacao || typeof this.localizacao.latitude !== 'number' || typeof this.localizacao.longitude !== 'number') {
      erros.push('As coordenadas de localização são obrigatórias.');
    }
    if (this.urlsFotos.length === 0 && !this.urlFoto) {
      erros.push('Ao menos uma foto comprobatória deve ser anexada.');
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  }

  /**
   * Converte a instância para o formato a ser persistido no banco de dados.
   */
  public toFirestorePayload(): Record<string, unknown> {
    return {
      id: this.id,
      id_denunciador: this.id_denunciador,
      id_revisor: this.id_revisor || null,
      statusDenuncia: this.statusDenuncia,
      bairro: this.bairro,
      urlFoto: this.fotoPrincipal || null,
      urlsFotos: this.urlsFotos,
    };
  }
}
