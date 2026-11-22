import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Denuncia, StatusDenuncia } from '@/src/types';

const STATUS_VALIDOS: StatusDenuncia[] = [
  'pendente',
  'confirmada',
  'rejeitada',
];

function isStatusDenuncia(value: unknown): value is StatusDenuncia {
  return typeof value === 'string' && STATUS_VALIDOS.includes(value as StatusDenuncia);
}

function toDate(value: unknown, denunciaId: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (isTimestamp(value)) {
    const date = value.toDate();
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  throw new Error(`A denúncia ${denunciaId} possui uma data de criação inválida.`);
}

function isTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  );
}

function toDenuncia(snapshot: DocumentSnapshot<DocumentData>): Denuncia {
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
    !isStatusDenuncia(data.statusDenuncia) ||
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
    ? data.urlsFotos.filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
    : typeof data.urlFoto === 'string' && data.urlFoto.trim().length > 0
      ? [data.urlFoto.trim()]
      : [];

  const urlFoto = typeof data.urlFoto === 'string' && data.urlFoto.trim().length > 0
    ? data.urlFoto.trim()
    : urlsFotos[0];

  return {
    id: denunciaId,
    id_denunciador: data.id_denunciador,
    id_revisor: typeof data.id_revisor === 'string' && data.id_revisor ? data.id_revisor : undefined,
    statusDenuncia: data.statusDenuncia,
    localizacao: {
      latitude: data.localizacao.latitude,
      longitude: data.localizacao.longitude,
    },
    bairro: data.bairro.trim(),
    urlFoto,
    urlsFotos,
    dataCriacao: toDate(data.dataCriacao, denunciaId),
  };
}

export async function listarDenuncias(): Promise<Denuncia[]> {
  const snapshot = await getDocs(collection(db, 'denuncias'));

  return ordenarDenuncias(snapshot.docs.map(toDenuncia));
}

/**
 * Acompanha todas as denúncias em tempo real: chama `onChange` com a lista atualizada a cada mudança no Firestore.
 * Devolve a função que encerra o acompanhamento (chamar ao sair da tela).
 */
export function observarDenuncias(
  onChange: (denuncias: Denuncia[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    collection(db, 'denuncias'),
    (snapshot) => {
      try {
        onChange(ordenarDenuncias(snapshot.docs.map(toDenuncia)));
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError
  );
}

export async function listarMinhasDenuncias(usuarioId: string): Promise<Denuncia[]> {
  const usuarioIdNormalizado = usuarioId.trim();

  if (!usuarioIdNormalizado) {
    throw new Error('Não é possível listar denúncias sem identificar o usuário.');
  }

  const denunciasQuery = query(
    collection(db, 'denuncias'),
    where('id_denunciador', '==', usuarioIdNormalizado)
  );
  const snapshot = await getDocs(denunciasQuery);

  return ordenarDenuncias(snapshot.docs.map(toDenuncia));
}

function ordenarDenuncias(denuncias: Denuncia[]): Denuncia[] {
  return denuncias
    .sort((primeira, segunda) => segunda.dataCriacao.getTime() - primeira.dataCriacao.getTime());
}
