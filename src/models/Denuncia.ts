import {
  collection,
  doc,
  GeoPoint,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/services/firebase';
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
export class Denuncia implements IDenuncia {
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

export interface CriarDenunciaParams {
  id?: string;
  id_denunciador: string;
  latitude: number;
  longitude: number;
  bairro: string;
  urlFoto?: string;
  urlsFotos?: string[];
}

export class DenunciaManager {
  private static readonly STATUS_VALIDOS: StatusDenuncia[] = [
    'pendente',
    'confirmada',
    'rejeitada',
  ];

  static async registrar({
    id,
    id_denunciador,
    latitude,
    longitude,
    bairro,
    urlFoto,
    urlsFotos,
  }: CriarDenunciaParams): Promise<string> {
    if (!id_denunciador) {
      throw new Error('Não é possível registrar denúncia sem id_denunciador (usuário não autenticado).');
    }

    if (!bairro || bairro.trim().length < 2) {
      throw new Error('Não foi possível identificar o bairro da ocorrência.');
    }

    const fotosArray =
      Array.isArray(urlsFotos) && urlsFotos.length > 0
        ? urlsFotos
        : urlFoto && urlFoto.trim().length > 0
          ? [urlFoto.trim()]
          : [];

    const fotoPrincipal = fotosArray[0] || urlFoto || '';
    const docRef = id ? doc(db, 'denuncias', id) : doc(collection(db, 'denuncias'));

    await setDoc(docRef, {
      id: docRef.id,
      id_denunciador,
      localizacao: new GeoPoint(latitude, longitude),
      bairro: bairro.trim(),
      urlFoto: fotoPrincipal,
      urlsFotos: fotosArray,
      statusDenuncia: 'pendente',
      dataCriacao: serverTimestamp(),
    });

    return docRef.id;
  }

  static async revisar(
    denunciaId: string,
    statusDenuncia: Extract<StatusDenuncia, 'confirmada' | 'rejeitada'>,
    idRevisor: string
  ): Promise<void> {
    if (!denunciaId.trim()) {
      throw new Error('Não é possível revisar uma denúncia sem identificá-la.');
    }

    if (!idRevisor.trim()) {
      throw new Error('Não é possível revisar uma denúncia sem identificar o agente.');
    }

    await updateDoc(doc(db, 'denuncias', denunciaId), {
      statusDenuncia,
      id_revisor: idRevisor,
    });
  }

  static async listar(): Promise<Denuncia[]> {
    const snapshot = await getDocs(collection(db, 'denuncias'));
    return DenunciaManager.ordenar(snapshot.docs.map((item) => DenunciaManager.fromSnapshot(item)));
  }

  static observar(
    onChange: (denuncias: Denuncia[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return onSnapshot(
      collection(db, 'denuncias'),
      (snapshot) => {
        try {
          onChange(DenunciaManager.ordenar(snapshot.docs.map((item) => DenunciaManager.fromSnapshot(item))));
        } catch (error) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      },
      onError
    );
  }

  static async listarMinhas(usuarioId: string): Promise<Denuncia[]> {
    const usuarioIdNormalizado = usuarioId.trim();

    if (!usuarioIdNormalizado) {
      throw new Error('Não é possível listar denúncias sem identificar o usuário.');
    }

    const denunciasQuery = query(
      collection(db, 'denuncias'),
      where('id_denunciador', '==', usuarioIdNormalizado)
    );
    const snapshot = await getDocs(denunciasQuery);
    return DenunciaManager.ordenar(snapshot.docs.map((item) => DenunciaManager.fromSnapshot(item)));
  }

  static registrarDenuncia(params: CriarDenunciaParams): Promise<string> {
    return DenunciaManager.registrar(params);
  }

  static revisarDenuncia(
    denunciaId: string,
    statusDenuncia: Extract<StatusDenuncia, 'confirmada' | 'rejeitada'>,
    idRevisor: string
  ): Promise<void> {
    return DenunciaManager.revisar(denunciaId, statusDenuncia, idRevisor);
  }

  static listarDenuncias(): Promise<Denuncia[]> {
    return DenunciaManager.listar();
  }

  static observarDenuncias(
    onChange: (denuncias: Denuncia[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return DenunciaManager.observar(onChange, onError);
  }

  static listarMinhasDenuncias(usuarioId: string): Promise<Denuncia[]> {
    return DenunciaManager.listarMinhas(usuarioId);
  }

  private static ordenar(denuncias: Denuncia[]): Denuncia[] {
    return denuncias.sort(
      (primeira, segunda) => segunda.dataCriacao.getTime() - primeira.dataCriacao.getTime()
    );
  }

  private static isStatusDenuncia(value: unknown): value is StatusDenuncia {
    return typeof value === 'string' && DenunciaManager.STATUS_VALIDOS.includes(value as StatusDenuncia);
  }

  private static isTimestamp(value: unknown): value is Timestamp {
    return (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    );
  }

  private static toDate(value: unknown, denunciaId: string): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (DenunciaManager.isTimestamp(value)) {
      const date = value.toDate();
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    throw new Error(`A denúncia ${denunciaId} possui uma data de criação inválida.`);
  }

  private static fromSnapshot(snapshot: DocumentSnapshot<DocumentData>): Denuncia {
    const data = snapshot.data();
    const denunciaId = snapshot.id;

    if (!data) {
      throw new Error(`Não foi possível ler os dados da denúncia ${denunciaId}.`);
    }

    if (
      typeof data.id !== 'string' ||
      data.id !== denunciaId ||
      typeof data.id_denunciador !== 'string' ||
      !data.id_denunciador ||
      !DenunciaManager.isStatusDenuncia(data.statusDenuncia) ||
      typeof data.bairro !== 'string' ||
      !data.bairro.trim()
    ) {
      throw new Error(`A denúncia ${denunciaId} possui dados obrigatórios inválidos.`);
    }

    if (
      !data.localizacao ||
      typeof data.localizacao.latitude !== 'number' ||
      typeof data.localizacao.longitude !== 'number'
    ) {
      throw new Error(`A denúncia ${denunciaId} possui uma localização inválida.`);
    }

    const urlsFotos = Array.isArray(data.urlsFotos)
      ? data.urlsFotos.filter((u: unknown): u is string =>
          typeof u === 'string' && u.trim().length > 0
        )
      : typeof data.urlFoto === 'string' && data.urlFoto.trim().length > 0
        ? [data.urlFoto.trim()]
        : [];

    const urlFoto =
      typeof data.urlFoto === 'string' && data.urlFoto.trim().length > 0
        ? data.urlFoto.trim()
        : urlsFotos[0];

    return new Denuncia({
      id: denunciaId,
      id_denunciador: data.id_denunciador,
      id_revisor: typeof data.id_revisor === 'string' && data.id_revisor
        ? data.id_revisor
        : undefined,
      statusDenuncia: data.statusDenuncia,
      localizacao: {
        latitude: data.localizacao.latitude,
        longitude: data.localizacao.longitude,
      },
      bairro: data.bairro.trim(),
      urlFoto,
      urlsFotos,
      dataCriacao: DenunciaManager.toDate(data.dataCriacao, denunciaId),
    });
  }
}
