import { styles } from "@/constants/style";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/src/contexts/auth-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Profile() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    setMenuVisible(false);
    await logout();
    router.replace('/login');
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Perfil"
        accessibilityRole="button"
        style={styles.profileButton}
        onPress={() => setMenuVisible(true)}>
        <MaterialIcons name="person" size={28} color={AppColors.primaryText} />
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={styles.profileMenuBackdrop}
          onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[styles.profileMenu, { top: insets.top + 76, right: 18 }]}
            onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={AppColors.highRisk} />
            <Text style={styles.profileMenuItemText}>Sair</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
