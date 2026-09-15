import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastro: (email: string, senha: string, nome: string) => Promise<void>;
  loginAnonimo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    // Monitora a sessão do usuário em tempo real
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUsuario({
              id: firebaseUser.uid,
              nome: data.nome || 'Usuário',
              email: firebaseUser.email || '',
              role: data.role || 'cidadao',
              cpf: data.cpf || '',
              numero_matricula: data.numero_matricula || '',
            });
          } else {
            setUsuario({
              id: firebaseUser.uid,
              nome: firebaseUser.isAnonymous ? 'Cidadão Anônimo' : (firebaseUser.displayName || 'Cidadão'),
              email: firebaseUser.email || '',
              role: 'cidadao',
            });
          }
        } else {
          setUsuario(null);
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão do usuário:', error);
      } finally {
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, senha: string) {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function cadastro(email: string, senha: string, nome: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const novoUsuario: Usuario = {
      id: cred.user.uid,
      nome,
      email,
      role: 'cidadao',
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    };

    await setDoc(doc(db, 'usuarios', cred.user.uid), novoUsuario);
    setUsuario(novoUsuario);
  }

  async function loginAnonimo() {
    await signInAnonymously(auth);
  }

  async function logout() {
    await signOut(auth);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastro, loginAnonimo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
