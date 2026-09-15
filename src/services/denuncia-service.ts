import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from './firebase';

interface CriarDenunciaParams {
  id_denunciador: string;
  urlFoto: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Registra uma denúncia no Firestore amarrando a foto ao id_denunciador da sessão.
 */
export async function registrarDenuncia({
  id_denunciador,
  urlFoto,
  bairro = 'Recife',
  latitude = -8.0476,
  longitude = -34.8770,
}: CriarDenunciaParams): Promise<string> {
  if (!id_denunciador) {
    throw new Error('Não é possível registrar denúncia sem id_denunciador (usuário não autenticado).');
  }

  const docRef = await addDoc(collection(db, 'denuncias'), {
    id_denunciador,
    urlFoto,
    bairro,
    localizacao: new GeoPoint(latitude, longitude),
    statusDenuncia: 'pendente',
    dataCriacao: serverTimestamp(),
  });

  return docRef.id;
}
