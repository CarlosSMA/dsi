import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Preferências simples guardadas no aparelho. O SecureStore não funciona na web; lá usamos o localStorage.

export async function getPreference(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setPreference(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Sem armazenamento disponível (ex.: navegação privada): a preferência só não fica salva.
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removePreference(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignora
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// A preferência de pular as instruções da câmera vale por conta, neste aparelho.
// O SecureStore só aceita letras, números, ".", "-" e "_" na chave.
export const ocultarInstrucoesFotoKey = (userId: string) => `ocultar_instrucoes_foto_${userId.replace(/[^\w.-]/g, '_')}`;
