import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

export function SignupConfirmationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandHeader}>
          <View style={styles.logoMark}>
            <Image
              source={require('@/assets/images/vetor-risco-logo.png')}
              contentFit="contain"
              style={styles.logoImage}
            />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>VetorRisco</Text>
            <View style={styles.cityBadge}>
              <Text style={styles.cityBadgeText}>RECIFE</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Cadastro realizado</Text>

          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={56} color={AppColors.surface} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/login')}
            style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.appBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  logoImage: {
    width: 48,
    height: 58,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: AppColors.securityBlue,
    fontSize: 21,
    fontWeight: '800',
  },
  cityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
  },
  cityBadgeText: {
    color: AppColors.securityBlue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  card: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 32,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    color: AppColors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  checkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: AppColors.safe,
  },
  continueButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: AppColors.safe,
  },
  continueButtonText: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
