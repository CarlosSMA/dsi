import { addDoc, collection, GeoPoint, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface CriarDenunciaParams {
  id_denunciador: string;
  latitude: number;
  longitude: number;
}

export async function registrarDenuncia({
  id_denunciador,
  latitude,
  longitude,
}: CriarDenunciaParams): Promise<string> {
  if (!id_denunciador) {
    throw new Error('Não é possível registrar denúncia sem id_denunciador (usuário não autenticado).');
  }

  const docRef = await addDoc(collection(db, 'denuncias'), {
    id_denunciador,
    localizacao: new GeoPoint(latitude, longitude),
    statusDenuncia: 'pendente',
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });

  return docRef.id;
}
