import * as SecureStore from 'expo-secure-store';

export function setSecureItem(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value);
}

export function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export function deleteSecureItem(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}
