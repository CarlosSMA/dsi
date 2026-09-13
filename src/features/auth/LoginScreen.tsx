import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <View style={styles.logoMark}>
            <MaterialIcons name="water-drop" size={34} color={colors.primary} />
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>VetorRisco</Text>
            <View style={styles.cityBadge}>
              <Text style={styles.cityBadgeText}>RECIFE</Text>
            </View>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Entrar na sua conta</Text>
          <Text style={styles.description}>
            Acompanhe o nivel de risco do seu bairro e reporte focos de mosquitos.
          </Text>
        </View>

        <View style={styles.formPlaceholder} />

        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <Text style={styles.susMark}>SUS</Text>
            <Text style={styles.footerSeparator}>•</Text>
            <Text style={styles.footerText}>Prefeitura do Recife</Text>
          </View>
          <Text style={styles.footerCaption}>Iniciativa de apoio a Saude Publica de Recife</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  primary: '#2167E8',
  navy: '#203D7D',
  ink: '#182234',
  muted: '#667080',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 24,
  },
  brandHeader: {
    marginBottom: 76,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: '800',
  },
  cityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
  },
  cityBadgeText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  intro: {
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  description: {
    maxWidth: 310,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  formPlaceholder: {
    flex: 1,
    minHeight: 280,
  },
  footer: {
    alignItems: 'center',
    gap: 7,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  susMark: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  footerSeparator: {
    color: '#AAB3C2',
    fontSize: 12,
  },
  footerText: {
    color: '#596273',
    fontSize: 12,
  },
  footerCaption: {
    color: '#8B94A3',
    fontSize: 10,
  },
});

