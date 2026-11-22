import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';

interface ImageCarouselProps {
  images?: string[];
  height?: number;
  borderRadius?: number;
  onImagePress?: (index: number) => void;
}

export function ImageCarousel({
  images = [],
  height = 190,
  borderRadius = 10,
  onImagePress,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<any>(null);

  // Normaliza lista de fotos removendo URLs vazias
  const validImages = images.filter((img) => typeof img === 'string' && img.trim().length > 0);

  if (validImages.length === 0) {
    return (
      <View style={[styles.placeholderContainer, { height, borderRadius }]}>
        <MaterialIcons name="image-not-supported" size={32} color="#94A3B8" />
        <Text style={styles.placeholderText}>Sem fotos registradas</Text>
      </View>
    );
  }

  if (validImages.length === 1) {
    return (
      <>
        <Pressable
          style={[styles.singleImageContainer, { height, borderRadius }]}
          onPress={() => {
            setFullscreenIndex(0);
            setFullscreenVisible(true);
            onImagePress?.(0);
          }}>
          <Image source={{ uri: validImages[0] }} style={styles.image} contentFit="cover" />
          <View style={styles.singleBadge}>
            <MaterialIcons name="photo" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>1 foto</Text>
          </View>
        </Pressable>

        <FullscreenViewer
          visible={fullscreenVisible}
          images={validImages}
          initialIndex={fullscreenIndex}
          onClose={() => setFullscreenVisible(false)}
        />
      </>
    );
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (containerWidth <= 0) return;
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / containerWidth);
    if (index !== activeIndex && index >= 0 && index < validImages.length) {
      setActiveIndex(index);
    }
  }

  function scrollToIndex(index: number) {
    if (index >= 0 && index < validImages.length && containerWidth > 0) {
      scrollRef.current?.scrollTo({ x: index * containerWidth, animated: true });
      setActiveIndex(index);
    }
  }

  return (
    <>
      <View
        style={[styles.carouselWrapper, { height, borderRadius }]}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
        {containerWidth > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scroll}>
            {validImages.map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                style={{ width: containerWidth, height }}
                onPress={() => {
                  setFullscreenIndex(index);
                  setFullscreenVisible(true);
                  onImagePress?.(index);
                }}>
                <Image source={{ uri }} style={styles.image} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Badge indicador de quantidade (ex: 1/3) */}
        <View style={styles.counterBadge}>
          <MaterialIcons name="collections" size={13} color="#FFFFFF" />
          <Text style={styles.counterBadgeText}>
            {activeIndex + 1}/{validImages.length}
          </Text>
        </View>

        {/* Botões de seta para navegação rápida (especialmente útil no Web e desktop) */}
        {activeIndex > 0 ? (
          <Pressable
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={() => scrollToIndex(activeIndex - 1)}
            hitSlop={8}>
            <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {activeIndex < validImages.length - 1 ? (
          <Pressable
            style={[styles.arrowButton, styles.arrowRight]}
            onPress={() => scrollToIndex(activeIndex + 1)}
            hitSlop={8}>
            <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {/* Bolinhas de paginação (Dots) */}
        <View style={styles.dotsContainer}>
          {validImages.map((_, i) => (
            <Pressable
              key={`dot-${i}`}
              onPress={() => scrollToIndex(i)}
              style={[styles.dot, i === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      {/* Visualizador Fullscreen ao Clicar na Imagem */}
      <FullscreenViewer
        visible={fullscreenVisible}
        images={validImages}
        initialIndex={fullscreenIndex}
        onClose={() => setFullscreenVisible(false)}
      />
    </>
  );
}

interface FullscreenViewerProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

function FullscreenViewer({ visible, images, initialIndex, onClose }: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.fullscreenOverlay}>
        <View style={styles.fullscreenHeader}>
          <Text style={styles.fullscreenCounter}>
            Foto {currentIndex + 1} de {images.length}
          </Text>
          <Pressable style={styles.fullscreenClose} onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(index);
          }}
          style={styles.fullscreenScroll}>
          {images.map((uri, idx) => (
            <View key={`fullscreen-${uri}-${idx}`} style={[styles.fullscreenSlide, { width: screenWidth }]}>
              <Image source={{ uri }} style={styles.fullscreenImage} contentFit="contain" />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  singleImageContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  placeholderText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  singleBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  counterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  counterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  activeDot: {
    width: 18,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
  // Fullscreen
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fullscreenCounter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenClose: {
    padding: 6,
  },
  fullscreenScroll: {
    flex: 1,
  },
  fullscreenSlide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
