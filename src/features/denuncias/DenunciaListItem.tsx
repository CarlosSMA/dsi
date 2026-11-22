import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ImageCarousel } from '@/components/image-carousel';
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
  const [modalVisible, setModalVisible] = useState(false);

  // Normalização de fotos: suporta array urlsFotos ou urlFoto única
  const fotos = useMemo(() => {
    if (Array.isArray(denuncia.urlsFotos) && denuncia.urlsFotos.length > 0) {
      return denuncia.urlsFotos.filter((u) => typeof u === 'string' && u.trim().length > 0);
    }
    if (typeof denuncia.urlFoto === 'string' && denuncia.urlFoto.trim().length > 0) {
      return [denuncia.urlFoto.trim()];
    }
    return [];
  }, [denuncia.urlsFotos, denuncia.urlFoto]);

  const fotoCapa = fotos[0] || null;

  function handleReview(statusDenuncia: 'confirmada' | 'rejeitada') {
    setModalVisible(false);
    onReview?.(statusDenuncia);
  }

  return (
    <View style={styles.denunciaCard}>
      {/* Miniatura com Badge de Múltiplas Fotos */}
      <Pressable
        style={styles.thumbnailWrapper}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Visualizar fotos da ocorrência">
        {fotoCapa ? (
          <Image source={{ uri: fotoCapa }} style={styles.denunciaImage} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="image-not-supported" size={28} color="#94A3B8" />
          </View>
        )}

        {fotos.length > 1 ? (
          <View style={styles.multiPhotoBadge}>
            <MaterialIcons name="collections" size={11} color="#FFFFFF" />
            <Text style={styles.multiPhotoBadgeText}>{fotos.length}</Text>
          </View>
        ) : null}
      </Pressable>

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
          <Text style={styles.detailText}>
            {denuncia.localizacao
              ? `${denuncia.localizacao.latitude.toFixed(4)}, ${denuncia.localizacao.longitude.toFixed(4)}`
              : 'Localização registrada'}
          </Text>
        </View>

        <View style={styles.cardActionsRow}>
          <Pressable
            accessibilityLabel="Ver detalhes e fotos da denúncia"
            accessibilityRole="button"
            onPress={() => setModalVisible(true)}
            style={styles.detailsButton}>
            <MaterialIcons name="photo-library" size={14} color={AppColors.actionBlue} />
            <Text style={styles.detailsButtonText}>
              {fotos.length > 1 ? `Ver ${fotos.length} fotos` : 'Ver fotos'}
            </Text>
          </Pressable>

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
      </View>

      {/* Modal de Detalhes da Denúncia com Carrossel de Imagens */}
      <Modal
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Ocorrência em {denuncia.bairro}</Text>
                <Text style={styles.modalSubtitle}>
                  {formatarData(denuncia.dataCriacao)} • Recife
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar detalhes"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <MaterialIcons name="close" size={22} color={AppColors.secondaryText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Carrossel de Imagens do Foco */}
              <View style={styles.carouselSection}>
                <ImageCarousel images={fotos} height={210} borderRadius={12} />
              </View>

              {/* Informações da Ocorrência */}
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bairro:</Text>
                  <Text style={styles.infoValue}>{denuncia.bairro}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Coordenadas GPS:</Text>
                  <Text style={styles.infoValue}>
                    {denuncia.localizacao
                      ? `${denuncia.localizacao.latitude.toFixed(6)}, ${denuncia.localizacao.longitude.toFixed(6)}`
                      : 'Não disponível'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Evidências fotográficas:</Text>
                  <Text style={styles.infoValue}>
                    {fotos.length} {fotos.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                  </Text>
                </View>
              </View>

              {/* Se o usuário for agente de saúde e puder revisar */}
              {canReview ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Avaliação Sanitária da Vigilância</Text>
                  <Text style={styles.reviewSectionDesc}>
                    Confirme se as evidências do foco procedem para envio da equipe de controle vetorial.
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
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>Confirmar Foco</Text>
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
                      <MaterialIcons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectButtonText}>Descartar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </ScrollView>
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
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  denunciaImage: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 96,
    width: 96,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  multiPhotoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiPhotoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  denunciaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  denunciaHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  denunciaNeighborhood: {
    color: AppColors.primaryText,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  detailText: {
    color: AppColors.secondaryText,
    fontSize: 11,
    marginLeft: 6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  detailsButtonText: {
    color: AppColors.actionBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  reviewButton: {
    alignItems: 'center',
    backgroundColor: AppColors.actionBlue,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleBox: {
    flex: 1,
  },
  modalTitle: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  modalScroll: {
    paddingVertical: 14,
    gap: 14,
  },
  carouselSection: {
    width: '100%',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    color: AppColors.primaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reviewSectionTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewSectionDesc: {
    color: '#3B82F6',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
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
});
