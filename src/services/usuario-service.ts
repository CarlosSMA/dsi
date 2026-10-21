import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { auth, db } from './firebase';

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

/**
 * Troca a senha do usuário logado. O Firebase exige confirmar a senha atual (reautenticação)
 * antes de permitir a troca; se a senha atual estiver errada, o erro "auth/invalid-credential" é lançado.
 */
export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Sessão expirada. Entre novamente para alterar a senha.');
  }

  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, senhaAtual));
  await updatePassword(user, novaSenha);
}
