import { collection, doc, GeoPoint, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

interface CriarDenunciaParams {
  id?: string;
  id_denunciador: string;
  latitude: number;
  longitude: number;
  bairro: string;
  urlFoto: string;
}

export async function registrarDenuncia({
  id,
  id_denunciador,
  latitude,
  longitude,
  bairro,
  urlFoto,
}: CriarDenunciaParams): Promise<string> {
  if (!id_denunciador) {
    throw new Error('Não é possível registrar denúncia sem id_denunciador (usuário não autenticado).');
  }

  if (!bairro || bairro.trim().length < 2) {
    throw new Error('Não foi possível identificar o bairro da ocorrência.');
  }

  const docRef = id ? doc(db, 'denuncias', id) : doc(collection(db, 'denuncias'));
  await setDoc(docRef, {
    id: docRef.id,
    id_denunciador,
    localizacao: new GeoPoint(latitude, longitude),
    bairro: bairro.trim(),
    urlFoto,
    statusDenuncia: 'pendente',
    dataCriacao: serverTimestamp(),
  });

  return docRef.id;
}
