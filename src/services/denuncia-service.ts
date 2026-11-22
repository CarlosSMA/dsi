import {
  collection,
  doc,
  GeoPoint,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StatusDenuncia } from '@/src/types';

export interface CriarDenunciaParams {
  id?: string;
  id_denunciador: string;
  latitude: number;
  longitude: number;
  bairro: string;
  urlFoto?: string;
  urlsFotos?: string[];
}

export async function registrarDenuncia({
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

export async function revisarDenuncia(
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
