import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import type { Denuncia, StatusDenuncia } from '@/src/types';

const STATUS_CONFIG: Record<
  StatusDenuncia,
  { label: string; color: string; backgroundColor: string }
> = {
  pendente: {
    label: 'Pendente',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
  },
  em_analise: {
    label: 'Em análise',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
  },
  confirmada: {
    label: 'Confirmada',
    color: '#047857',
    backgroundColor: '#D1FAE5',
  },
  descartada: {
    label: 'Descartada',
    color: '#475569',
    backgroundColor: '#E2E8F0',
  },
};

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(data);
}

interface DenunciaListItemProps {
  denuncia: Denuncia;
}

export function DenunciaListItem({ denuncia }: DenunciaListItemProps) {
  const status = STATUS_CONFIG[denuncia.statusDenuncia];

  return (
    <View style={styles.denunciaCard}>
      {denuncia.urlFoto ? (
        <Image source={{ uri: denuncia.urlFoto }} style={styles.denunciaImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialIcons name="image-not-supported" size={28} color="#94A3B8" />
        </View>
      )}

      <View style={styles.denunciaContent}>
        <View style={styles.denunciaHeader}>
          <Text style={styles.denunciaNeighborhood} numberOfLines={1}>
            {denuncia.bairro}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color={AppColors.secondaryText} />
          <Text style={styles.detailText}>{formatarData(denuncia.dataCriacao)}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={AppColors.secondaryText} />
          <Text style={styles.detailText}>Localização registrada</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  denunciaCard: {
    backgroundColor: AppColors.surface,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 12,
  },
  denunciaImage: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 92,
    marginRight: 12,
    width: 92,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 92,
    justifyContent: 'center',
    marginRight: 12,
    width: 92,
  },
  denunciaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  denunciaHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  denunciaNeighborhood: {
    color: AppColors.primaryText,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 5,
  },
  detailText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    marginLeft: 6,
  },
});
