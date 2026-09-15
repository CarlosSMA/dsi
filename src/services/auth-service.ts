import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { auth, db } from './firebase';

const CPF_LENGTH = 11;

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, CPF_LENGTH);
  if (digits.length !== CPF_LENGTH) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Traduz códigos de erro do Firebase Auth para mensagens amigáveis em português.
 */
export function translateFirebaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'CPF ou senha incorretos.';
      case 'auth/user-not-found':
        return 'Nenhum usuário cadastrado com este CPF.';
      case 'auth/user-disabled':
        return 'Esta conta foi desativada. Entre em contato com o suporte.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas consecutivas. Tente novamente mais tarde.';
      case 'auth/network-request-failed':
        return 'Falha de conexão. Verifique sua internet.';
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocorreu um erro ao entrar. Tente novamente.';
}

/**
 * Autentica o usuário no Firebase Auth buscando o e-mail cadastrado a partir do CPF no Firestore.
 */
export async function loginWithCpf(cpf: string, senha: string): Promise<void> {
  const cleanCpf = cpf.replace(/\D/g, '');
  const formattedCpf = formatCpf(cleanCpf);

  const candidates = Array.from(new Set([cleanCpf, formattedCpf]));

  const usersRef = collection(db, 'usuarios');
  const userQuery = query(usersRef, where('cpf', 'in', candidates));
  const querySnapshot = await getDocs(userQuery);

  if (querySnapshot.empty) {
    throw new Error('Nenhum usuário cadastrado com este CPF.');
  }

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();
  const email = userData.email;

  if (!email) {
    throw new Error('Usuário encontrado, mas sem e-mail vinculado.');
  }

  await signInWithEmailAndPassword(auth, email, senha);
}
