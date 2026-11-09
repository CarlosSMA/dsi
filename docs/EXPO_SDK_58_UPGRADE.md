# Atualização do Projeto para Expo SDK 58 e React Native 0.88 - VetorRisco

Este documento descreve as etapas técnicas realizadas para a migração e compatibilização do aplicativo **VetorRisco** com o **Expo SDK 58**, garantindo que a equipe possa executar e depurar a aplicação diretamente pelo **Expo Go** em seus dispositivos móveis.

---

## 1. Motivação da Atualização

O aplicativo **Expo Go** (Android / iOS) foi atualizado nas lojas de aplicativos (Google Play Store e Apple App Store) para a versão compatível com o **Expo SDK 58**. Ao escanear o QR Code de um projeto em versão anterior (SDK 57), o Expo Go bloqueava a inicialização exigindo a adequação do runtime.

---

## 2. Matriz de Dependências Atualizadas

| Pacote / Módulo | Versão Anterior (SDK 57) | Nova Versão (SDK 58) |
| :--- | :--- | :--- |
| **`expo`** | `^57.0.22` | `^58.0.23` |
| **`react-native`** | `0.86.3` | `0.88.1` |
| **`react` / `react-dom`** | `19.2.3` | `19.3.0` |
| **`expo-router`** | `~57.0.21` | `~58.0.30` |
| **`expo-constants`** | `~57.0.18` | `~58.0.15` |
| **`expo-file-system`** | `~57.0.7` | `~58.0.13` |
| **`expo-font`** | `~57.0.4` | `~58.0.11` |
| **`expo-image`** | `~57.0.5` | `~58.0.18` |
| **`expo-image-picker`** | `~57.0.17` | `~58.0.10` |
| **`expo-location`** | `~57.0.18` | `~58.0.20` |
| **`expo-secure-store`** | `~57.0.4` | `~58.0.2` |
| **`expo-splash-screen`** | `~57.0.9` | `~58.0.13` |
| **`react-native-gesture-handler`**| `~2.32.0` | `~3.3.0` |
| **`react-native-maps`** | `1.27.2` | `1.29.11` |
| **`react-native-reanimated`** | `4.5.1` | `4.7.1` |
| **`react-native-safe-area-context`**| `~5.7.0` | `~5.11.1` |
| **`react-native-screens`** | `~4.26.0` | `~4.30.1` |
| **`react-native-worklets`** | `0.10.1` | `0.13.0` |

---

## 3. Ajustes de Código e Compatibilidade

### 3.1. Tipagem Estrita de Eventos do `Pressable`
No React Native 0.88, o manipulador `onPress` do `Pressable` reforçou a checagem de tipos contra `GestureResponderEvent`. Para formulários integrados ao `react-hook-form`, a chamada de submissão foi desacoplada para evitar conflitos de assinatura sintética:
```tsx
// Antes
onPress={submitForm(onSubmit)}

// Atualizado (Compatível)
onPress={() => submitForm(onSubmit)()}
```
Aplicado nas telas de `LoginScreen`, `SignupScreen` e `ForgotPasswordScreen`.

### 3.2. Normalização de Cores dos Ícones (`IconSymbol`)
Adequação do prop `color` no componente de abstração de ícones multiplataforma (`icon-symbol.tsx` e `icon-symbol.ios.tsx`), resolvendo divergências internas de `OpaqueColorValue` do novo motor do React Native.

---

## 4. Como Executar o Projeto Atualizado

Para rodar a versão atualizada:

```bash
# 1. Puxar as últimas alterações
git pull origin master

# 2. Instalar as dependências do SDK 58
npm install --legacy-peer-deps

# 3. Iniciar o servidor limpando o cache
npx expo start -c
```
Abra o **Expo Go** atualizado no smartphone e aponte a câmera para o QR Code gerado no terminal.
