import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, UrlTile, type Region } from 'react-native-maps';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { MapLocateButton } from '@/components/map-locate-button';
import {
  areaDoBairro,
  BAIRRO_DETAIL_DELTA,
  BAIRRO_BORDER,
  BAIRRO_FILL,
  BAIRRO_MAX_ZOOM,
  clampRegionToRecife,
  focusForArea,
  isInsideRecife,
  labelFits,
  lonSpanOf,
  MAP_ATTRIBUTION,
  MAP_TILE_URL,
  MICRO_BORDER,
  MICRO_FILL,
  OSM_MAX_ZOOM,
  OUTSIDE_RECIFE_FILL,
  OUTSIDE_RECIFE_MASK,
  RECIFE_BAIRROS,
  RECIFE_MICRORREGIOES,
  RECIFE_FIT_PADDING,
  RECIFE_MIN_ZOOM,
  RECIFE_OUTLINE,
  RECIFE_REGION,
  toMapCoordinates,
  type MapFocus,
  type MapScope,
} from '@/constants/map';
import { AppColors } from '@/constants/theme';
import { Gps } from '@/src/lib/gps';

interface MapSurfaceProps {
  focus?: MapFocus | null;
  scope: MapScope;
  // Chamado quando o cidadão toca numa região, para abrir os bairros dela.
  onSelectArea?: (focus: MapFocus) => void;
}

const EDGE_PADDING = { top: 140, right: 48, bottom: 220, left: 48 };
const ANIMATION_MS = 600;

// Mapa dos cidadãos: por cima do mapa realista, as regiões do Recife; ao abrir uma região (ou de perto),
// os bairros.
const toShape = (area: { label: [number, number]; rings: [number, number][][] }) => ({
  label: { latitude: area.label[1], longitude: area.label[0] },
  rings: area.rings.map(toMapCoordinates),
  lonSpan: lonSpanOf(area.rings),
});
const MICRO_SHAPES = RECIFE_MICRORREGIOES.map((micro) => ({
  ...toShape(micro),
  id: micro.codigo,
  nome: micro.nome,
  focus: focusForArea(micro),
}));
const BAIRRO_SHAPES = RECIFE_BAIRROS.map((bairro) => ({
  ...toShape(bairro),
  id: bairro.nome,
  nome: bairro.nome,
  area: areaDoBairro(bairro.nome),
}));

// Guarda o zoom em passos de meio nível, para o mapa só ser redesenhado quando o zoom muda de fato.
const zoomOf = (longitudeDelta: number) => Math.round(Math.log2(360 / longitudeDelta) * 2) / 2;
const deltaOf = (zoom: number) => 360 / 2 ** zoom;
export default function MapSurface({ focus, scope, onSelectArea }: MapSurfaceProps) {
  const mapRef = useRef<MapView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [zoom, setZoom] = useState(zoomOf(RECIFE_REGION.longitudeDelta));
  const visibleDelta = deltaOf(zoom);
  const showsBairroDetail = visibleDelta <= BAIRRO_DETAIL_DELTA;
  // Região aberta (tocada ou com um bairro pesquisado): mostra os bairros dela mesmo com o mapa afastado.
  const openArea = focus?.area;
  const visibleBairros = showsBairroDetail
    ? BAIRRO_SHAPES
    : BAIRRO_SHAPES.filter((bairro) => openArea && bairro.area === openArea);
  const visibleAreas = showsBairroDetail ? [] : MICRO_SHAPES.filter((micro) => micro.id !== openArea);
  const fits = (area: { nome: string; lonSpan: number }) =>
    labelFits(area.nome, (area.lonSpan / visibleDelta) * screenWidth);
  const visibleAreaLabels = visibleAreas.filter(fits);
  const visibleBairroLabels = visibleBairros.filter(fits);

  useEffect(() => {
    if (!focus) {
      return;
    }

    const outline = focus.outline?.flat();
    if (outline?.length) {
      mapRef.current?.fitToCoordinates(outline, { edgePadding: EDGE_PADDING, animated: true });
    } else {
      mapRef.current?.animateToRegion(focus, ANIMATION_MS);
    }
  }, [focus]);

  // Se o usuário arrastar o centro do mapa para fora do Recife, o mapa volta para a cidade.
  function handleRegionChangeComplete(region: Region) {
    setZoom(zoomOf(region.longitudeDelta));

    const clamped = clampRegionToRecife(region);
    if (clamped.latitude !== region.latitude || clamped.longitude !== region.longitude) {
      mapRef.current?.animateToRegion(clamped, ANIMATION_MS);
    }
  }

  // Enquadra o Recife inteiro na tela, descontando a busca e o botão de foto.
  function fitRecife(animated: boolean) {
    mapRef.current?.fitToCoordinates(RECIFE_OUTLINE, { edgePadding: RECIFE_FIT_PADDING, animated });
  }

  async function handleLocateMe() {
    const coords = await Gps.getCurrentLocation();
    if (!coords) {
      return;
    }

    if (!isInsideRecife(coords)) {
      fitRecife(true);
      return;
    }

    const delta = scope === 'rua' ? 0.008 : 0.03;
    mapRef.current?.animateToRegion(
      { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: delta, longitudeDelta: delta },
      ANIMATION_MS,
    );
  }

  return (
    <>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        // Esconde o mapa do sistema por baixo das camadas do OpenStreetMap. No Android, "none" desliga o
        // Google Maps; no iOS não existe "none", e "satellite" é o único tipo do Apple Maps sem nomes de
        // cidades e ruas (que, no "standard", aparecem misturados aos do OpenStreetMap).
        mapType={Platform.OS === 'android' ? 'none' : 'satellite'}
        style={styles.map}
        initialRegion={RECIFE_REGION}
        onMapReady={() => fitRecife(false)}
        minZoomLevel={RECIFE_MIN_ZOOM}
        maxZoomLevel={scope === 'bairro' ? BAIRRO_MAX_ZOOM : OSM_MAX_ZOOM}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}>
        {/* Mapa realista com o entorno do Recife esmaecido, para os dois perfis. */}
        <UrlTile urlTemplate={MAP_TILE_URL} maximumZ={OSM_MAX_ZOOM} shouldReplaceMapContent />
        <Polygon
          coordinates={OUTSIDE_RECIFE_MASK}
          holes={[RECIFE_OUTLINE]}
          fillColor={OUTSIDE_RECIFE_FILL}
          // Sem borda: no iOS, só zerar a espessura ainda desenhava uma linha escura no limite da cidade.
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={1}
        />

        {/* Os dois perfis veem as regiões do Recife (e, de perto ou ao abrir uma região, os bairros).
            A diferença é o zoom: cidadãos vão só até o nível de bairro; a prefeitura chega às ruas. */}
        {MICRO_SHAPES.flatMap((micro) =>
          micro.rings.map((ring, index) => (
            <Polygon
              key={`${micro.id}-${index}`}
              coordinates={ring}
              fillColor={MICRO_FILL}
              strokeColor={MICRO_BORDER}
              strokeWidth={1}
              zIndex={2}
              tappable
              // Tocar numa região abre os bairros que a compõem.
              onPress={() => onSelectArea?.(micro.focus)}
            />
          )),
        )}

        {visibleBairros.flatMap((bairro) =>
          bairro.rings.map((ring, index) => (
            <Polygon
              key={`${bairro.id}-${index}`}
              coordinates={ring}
              fillColor={BAIRRO_FILL}
              strokeColor={BAIRRO_BORDER}
              strokeWidth={1}
              zIndex={3}
            />
          )),
        )}

        {/* Só mostra o nome das áreas grandes o bastante na tela; as menores ganham nome ao aproximar. */}
        {visibleAreaLabels.map((area) => (
          <Marker key={area.id} coordinate={area.label} tracksViewChanges={false}>
            <Text style={styles.microLabel}>{area.nome}</Text>
          </Marker>
        ))}
        {visibleBairroLabels.map((bairro) => (
          <Marker key={bairro.id} coordinate={bairro.label} tracksViewChanges={false}>
            <Text style={styles.bairroLabel}>{bairro.nome}</Text>
          </Marker>
        ))}

        {focus?.outline?.map((ring, index) => (
          <Polygon
            key={`${focus.title}-${index}`}
            coordinates={ring}
            strokeColor={AppColors.actionBlue}
            strokeWidth={2.5}
            fillColor="rgba(28, 100, 242, 0.16)"
            zIndex={4}
          />
        ))}

        {focus?.scope === 'rua' ? (
          <Marker
            coordinate={{ latitude: focus.latitude, longitude: focus.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}>
            <View style={styles.pin}>
              <View style={styles.pinHead}>
                <MaterialIcons name="place" size={20} color={AppColors.surface} />
              </View>
              <View style={styles.pinTip} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <MapLocateButton onPress={handleLocateMe} />

      <Text style={styles.attribution}>{MAP_ATTRIBUTION}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
  microLabel: {
    color: AppColors.securityBlue,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    // Contorno branco para o nome ficar legível sobre as ruas.
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  bairroLabel: {
    maxWidth: 96,
    color: AppColors.secondaryText,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  pin: {
    alignItems: 'center',
  },
  pinHead: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: AppColors.surface,
    backgroundColor: AppColors.actionBlue,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: AppColors.actionBlue,
  },
  // Crédito obrigatório do mapa (Stadia e OpenStreetMap): pequeno e discreto, mas visível.
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    color: '#94A3B8',
    fontSize: 8,
  },
});
