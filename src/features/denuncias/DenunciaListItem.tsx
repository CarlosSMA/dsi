import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  confirmada: {
    label: 'Confirmada',
    color: '#047857',
    backgroundColor: '#D1FAE5',
  },
  rejeitada: {
    label: 'Rejeitada',
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
  onReview?: (status: 'confirmada' | 'rejeitada') => void;
  reviewing?: boolean;
}

export function DenunciaListItem({ denuncia, onReview, reviewing = false }: DenunciaListItemProps) {
  const status = STATUS_CONFIG[denuncia.statusDenuncia];
  const canReview = denuncia.statusDenuncia === 'pendente' && onReview;
  const [modalVisible, setModalVisible] = React.useState(false);

  function handleReview(statusDenuncia: 'confirmada' | 'rejeitada') {
    setModalVisible(false);
    onReview?.(statusDenuncia);
  }

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

        {canReview ? (
          <Pressable
            accessibilityLabel="Revisar denúncia"
            accessibilityRole="button"
            disabled={reviewing}
            onPress={() => setModalVisible(true)}
            style={[styles.reviewButton, reviewing && styles.disabledButton]}>
            <Text style={styles.reviewButtonText}>{reviewing ? 'Salvando...' : 'Revisar'}</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar denúncia</Text>
              <Pressable
                accessibilityLabel="Cancelar revisão"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <MaterialIcons name="close" size={22} color={AppColors.secondaryText} />
              </Pressable>
            </View>
            <Text style={styles.modalDescription}>
              Escolha o resultado da revisão. Essa decisão não poderá ser alterada.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityLabel="Aceitar denúncia"
                accessibilityRole="button"
                disabled={reviewing}
                onPress={() => handleReview('confirmada')}
                style={[
                  styles.actionButton,
                  styles.confirmButton,
                  reviewing && styles.disabledButton,
                ]}>
                <Text style={styles.confirmButtonText}>Aceitar</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Rejeitar denúncia"
                accessibilityRole="button"
                disabled={reviewing}
                onPress={() => handleReview('rejeitada')}
                style={[
                  styles.actionButton,
                  styles.rejectButton,
                  reviewing && styles.disabledButton,
                ]}>
                <Text style={styles.rejectButtonText}>Rejeitar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  reviewButton: {
    alignItems: 'center',
    backgroundColor: AppColors.actionBlue,
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 9,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  confirmButton: {
    backgroundColor: '#047857',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  rejectButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: AppColors.primaryText,
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalDescription: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
