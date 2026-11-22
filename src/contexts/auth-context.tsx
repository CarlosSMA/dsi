import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { UsuarioManager } from '../models/Usuario';
import { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastro: (email: string, senha: string, nome: string) => Promise<void>;
  loginAnonimo: () => Promise<void>;
  logout: () => Promise<void>;
  // Atualiza os dados do usuário na sessão depois de salvá-los no Firestore.
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: () => void = () => { };

    async function iniciarSessao() {
      // Garante que o app sempre abra na tela de login,
      // encerrando qualquer sessão persistida do Firebase.
      try {
        await UsuarioManager.logout();
      } catch (error) {
        console.error('Erro ao encerrar sessão anterior:', error);
      }

      // Monitora a sessão do usuário em tempo real (a partir daqui)
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        setCarregando(true);
        try {
          if (firebaseUser) {
            const dadosUsuario = await UsuarioManager.obterPorId(firebaseUser.uid);
            setUsuario(
              dadosUsuario
                ? { ...dadosUsuario, email: firebaseUser.email || dadosUsuario.email }
                : UsuarioManager.fromFirebaseUser(firebaseUser)
            );
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.error('Erro ao recuperar sessão do usuário:', error);
        } finally {
          setCarregando(false);
        }
      });
    }

    iniciarSessao();

    return () => unsubscribe();
  }, []);

  async function login(email: string, senha: string) {
    await UsuarioManager.login(email, senha);
  }

  async function cadastro(email: string, senha: string, nome: string) {
    const novoUsuario = await UsuarioManager.cadastro(email, senha, nome);
    setUsuario(novoUsuario);
  }

  async function loginAnonimo() {
    await UsuarioManager.loginAnonimo();
  }

  async function logout() {
    await UsuarioManager.logout();
    setUsuario(null);
  }

  function atualizarUsuario(dados: Partial<Usuario>) {
    setUsuario((atual) => (atual ? { ...atual, ...dados } : atual));
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastro, loginAnonimo, logout, atualizarUsuario }}>
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