import { styles } from "@/constants/style";
import { AppColors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

export function Profile() {
  return (
    <View
      accessibilityLabel="Perfil"
      style={styles.profileButton}
      accessible
      pointerEvents="none">
      <MaterialIcons name="person" size={28} color={AppColors.primaryText} />
    </View>
  )
}
