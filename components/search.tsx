import { styles } from "@/constants/style";
import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TextInput, View } from "react-native";

export function Search() {
  return (
    <View style={styles.searchField}>
      <MaterialIcons name="search" size={25} color={AppColors.primaryText} />
      <TextInput
        placeholder="Pesquisar"
        placeholderTextColor={AppColors.secondaryText}
        style={styles.searchInput}
      />
    </View>
  )
}
