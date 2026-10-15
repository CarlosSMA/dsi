import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }

  return SecureStore.setItemAsync(key, value);
}

export function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.localStorage.getItem(key));
  }

  return SecureStore.getItemAsync(key);
}

export function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }

  return SecureStore.deleteItemAsync(key);
}
