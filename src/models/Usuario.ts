import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from '@/src/services/firebase';
import type { AgenteMunicipal, Usuario as IUsuario, UserRole } from '@/src/types';

export class Usuario implements IUsuario {
  public id: string;
  public nome: string;
  public email: string;
  public cpf?: string;
  public role: UserRole;
  public numero_matricula?: string;
  public dataNascimento?: string;
  public telefone?: string;
  public dataCriacao?: Date;
  public dataAtualizacao?: Date;

  constructor(dados: IUsuario) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.email = dados.email;
    this.cpf = dados.cpf;
    this.role = dados.role;
    this.numero_matricula = dados.numero_matricula;
    this.dataNascimento = dados.dataNascimento;
    this.telefone = dados.telefone;
    this.dataCriacao = dados.dataCriacao;
    this.dataAtualizacao = dados.dataAtualizacao;
  }

  public eAgente(): boolean {
    return this.role === 'agente';
  }

  public toFirestorePayload(): Record<string, unknown> {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      role: this.role,
      cpf: this.cpf || '',
      numero_matricula: this.numero_matricula || '',
      dataNascimento: this.dataNascimento || '',
      telefone: this.telefone || '',
      dataCriacao: this.dataCriacao || null,
      dataAtualizacao: this.dataAtualizacao || null,
    };
  }
}

export class AgenteMunicipalModel extends Usuario implements AgenteMunicipal {
  public numero_matricula: string;

  constructor(dados: AgenteMunicipal) {
    super(dados);
    this.numero_matricula = dados.numero_matricula;
  }
}

export interface DadosCadastraisInput {
  nome: string;
  dataNascimento: string;
  telefone: string;
}

export class UsuarioManager {
  static async login(email: string, senha: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  static async cadastro(email: string, senha: string, nome: string): Promise<Usuario> {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const novoUsuario = new Usuario({
      id: cred.user.uid,
      nome,
      email,
      role: 'cidadao',
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    });

    await setDoc(doc(db, 'usuarios', cred.user.uid), novoUsuario.toFirestorePayload());
    return novoUsuario;
  }

  static async loginAnonimo(): Promise<void> {
    await signInAnonymously(auth);
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static async obterPorId(id: string): Promise<Usuario | null> {
    const snapshot = await getDoc(doc(db, 'usuarios', id));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return new Usuario({
      id,
      nome: typeof data.nome === 'string' && data.nome ? data.nome : 'Usuário',
      email: typeof data.email === 'string' ? data.email : '',
      role: data.role === 'agente' ? 'agente' : 'cidadao',
      cpf: typeof data.cpf === 'string' ? data.cpf : undefined,
      numero_matricula: typeof data.numero_matricula === 'string'
        ? data.numero_matricula
        : undefined,
      dataNascimento: typeof data.dataNascimento === 'string'
        ? data.dataNascimento
        : undefined,
      telefone: typeof data.telefone === 'string' ? data.telefone : undefined,
    });
  }

  static fromFirebaseUser(firebaseUser: FirebaseUser, dados?: Record<string, unknown>): Usuario {
    if (dados) {
      return new Usuario({
        id: firebaseUser.uid,
        nome: typeof dados.nome === 'string' && dados.nome ? dados.nome : 'Usuário',
        email: firebaseUser.email || '',
        role: dados.role === 'agente' ? 'agente' : 'cidadao',
        cpf: typeof dados.cpf === 'string' ? dados.cpf : undefined,
        numero_matricula: typeof dados.numero_matricula === 'string'
          ? dados.numero_matricula
          : undefined,
        dataNascimento: typeof dados.dataNascimento === 'string'
          ? dados.dataNascimento
          : undefined,
        telefone: typeof dados.telefone === 'string' ? dados.telefone : undefined,
      });
    }

    return new Usuario({
      id: firebaseUser.uid,
      nome: firebaseUser.isAnonymous
        ? 'Cidadão Anônimo'
        : firebaseUser.displayName || 'Cidadão',
      email: firebaseUser.email || '',
      role: 'cidadao',
    });
  }

  static async atualizarDadosCadastrais(
    userId: string,
    dados: DadosCadastraisInput
  ): Promise<void> {
    await updateDoc(doc(db, 'usuarios', userId), {
      nome: dados.nome,
      dataNascimento: dados.dataNascimento || deleteField(),
      telefone: dados.telefone || deleteField(),
      dataAtualizacao: serverTimestamp(),
    });
  }

  static async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Sessão expirada. Entre novamente para alterar a senha.');
    }

    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, senhaAtual)
    );
    await updatePassword(user, novaSenha);
  }
}
