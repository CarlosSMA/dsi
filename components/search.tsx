import { AppAlert } from "@/components/app-alert";
import type { MapFocus, MapScope } from "@/constants/map";
import { styles } from "@/constants/style";
import { AppColors } from "@/constants/theme";
import { buscarEndereco } from "@/src/services/geocoding-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, TextInput, View } from "react-native";

interface SearchProps {
  scope: MapScope;
  onResult: (focus: MapFocus) => void;
}

export function Search({ scope, onResult }: SearchProps) {
  const [texto, setTexto] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  async function handleSearch() {
    const termo = texto.trim();

    if (termo.length < 3 || isSearching) {
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const resultado = await buscarEndereco(termo, scope);

      if (!resultado) {
        setAlertMessage(`Não encontramos "${termo}" no Recife. O app cobre apenas bairros e ruas do Recife.`);
        return;
      }

      onResult(resultado);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      setAlertMessage('Não foi possível buscar o endereço. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <View style={styles.searchField}>
      <MaterialIcons name="search" size={25} color={AppColors.primaryText} />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={handleSearch}
        placeholder={scope === 'rua' ? "Pesquisar rua do Recife" : "Pesquisar bairro ou rua do Recife"}
        placeholderTextColor={AppColors.secondaryText}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {isSearching ? (
        <ActivityIndicator size="small" color={AppColors.actionBlue} />
      ) : texto ? (
        <Pressable
          accessibilityLabel="Limpar pesquisa"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setTexto('')}>
          <MaterialIcons name="close" size={22} color={AppColors.secondaryText} />
        </Pressable>
      ) : null}

      <AppAlert
        visible={alertMessage !== null}
        title="Endereço não encontrado"
        messages={alertMessage ? [alertMessage] : []}
        onClose={() => setAlertMessage(null)}
      />
    </View>
  )
}
