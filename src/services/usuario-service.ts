import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from './firebase';

export interface DadosCadastraisInput {
  nome: string;
  // Formato ISO (AAAA-MM-DD); vazio remove o campo.
  dataNascimento: string;
  // Só os dígitos com DDD; vazio remove o campo.
  telefone: string;
}

/**
 * Atualiza os dados cadastrais editáveis do usuário no Firestore.
 * CPF, e-mail, papel e datas de criação não são alterados por aqui.
 */
export async function atualizarDadosCadastrais(userId: string, dados: DadosCadastraisInput): Promise<void> {
  await updateDoc(doc(db, 'usuarios', userId), {
    nome: dados.nome,
    dataNascimento: dados.dataNascimento || deleteField(),
    telefone: dados.telefone || deleteField(),
    // As regras do Firestore exigem a data de atualização igual ao horário da requisição.
    dataAtualizacao: serverTimestamp(),
  });
}

