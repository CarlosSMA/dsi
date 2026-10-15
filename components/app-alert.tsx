import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

type AppAlertProps = {
  visible: boolean;
  title: string;
  messages: string[];
  buttonLabel?: string;
  onClose: () => void;
};

export function AppAlert({ visible, title, messages, buttonLabel = 'Entendi', onClose }: AppAlertProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View accessibilityRole="alert" style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="error-outline" size={28} color={AppColors.highRisk} />
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.messageList}>
            {messages.map((message) => (
              <View key={message} style={styles.messageRow}>
                <View style={styles.bullet} />
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 14,
    backgroundColor: '#FEF2F2',
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  messageList: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: AppColors.highRisk,
  },
  messageText: {
    flex: 1,
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 26,
    backgroundColor: AppColors.actionBlue,
  },
  buttonText: {
    color: AppColors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
