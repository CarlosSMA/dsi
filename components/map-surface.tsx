import 'leaflet/dist/leaflet.css';

import type { Control, LayerGroup, Map as LeafletMap } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapLocateButton } from '@/components/map-locate-button';
import {
  areaDoBairro,
  BAIRRO_BORDER,
  BAIRRO_DETAIL_ZOOM,
  BAIRRO_FILL,
  BAIRRO_MAX_ZOOM,
  focusForArea,
  isInsideRecife,
  labelFits,
  lonSpanOf,
  MAP_ATTRIBUTION,
  MAP_BACKGROUND,
  MAP_TILE_URL,
  MICRO_BORDER,
  MICRO_FILL,
  OSM_MAX_ZOOM,
  OUTSIDE_RECIFE_FILL,
  OUTSIDE_RECIFE_MASK,
  RECIFE_BAIRROS,
  RECIFE_BOUNDS,
  RECIFE_MICRORREGIOES,
  RECIFE_FIT_PADDING,
  RECIFE_MIN_ZOOM,
  RECIFE_OUTLINE,
  type MapCoordinate,
  type MapFocus,
  type MapScope,
} from '@/constants/map';
import { AppColors } from '@/constants/theme';
import { Gps } from '@/src/lib/gps';

interface MapSurfaceProps {
  focus?: MapFocus | null;
  scope: MapScope;
  // Chamado quando o cidadão clica numa região, para abrir os bairros dela.
  onSelectArea?: (focus: MapFocus) => void;
}

// Espaço livre para a busca no topo e para o card e o botão de foto embaixo.
const PADDING_TOP_LEFT: [number, number] = [48, 140];
const PADDING_BOTTOM_RIGHT: [number, number] = [48, 220];

const toLatLngs = (ring: MapCoordinate[]) =>
  ring.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]);

// Os dados dos bairros vêm como [longitude, latitude]; o Leaflet usa [latitude, longitude].
const swap = (ring: [number, number][]) => ring.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);

// Nomes com contorno branco, para ficarem legíveis sobre as ruas.
const LABEL_HALO = 'text-shadow:0 0 3px rgba(255,255,255,0.95),0 0 3px rgba(255,255,255,0.95);';

const bairroLabelHtml = (nome: string) =>
  `<span style="position:absolute;transform:translate(-50%,-50%);width:96px;text-align:center;${LABEL_HALO}
    font:600 10px system-ui,-apple-system,sans-serif;color:${AppColors.secondaryText};">${nome}</span>`;

const microLabelHtml = (nome: string) =>
  `<span style="position:absolute;transform:translate(-50%,-50%);white-space:nowrap;text-align:center;${LABEL_HALO}
    font:700 12px system-ui,-apple-system,sans-serif;color:${AppColors.securityBlue};">${nome}</span>`;

const PIN_HTML = `
  <div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:38px;height:38px;border-radius:19px;border:3px solid ${AppColors.surface};
      background:${AppColors.actionBlue};box-shadow:0 3px 6px rgba(15,23,42,0.3);box-sizing:border-box;"></div>
    <div style="width:0;height:0;margin-top:-2px;border-left:7px solid transparent;
      border-right:7px solid transparent;border-top:10px solid ${AppColors.actionBlue};"></div>
  </div>`;

// O react-native-maps não roda na web; aqui o mapa é feito com Leaflet.
// O Leaflet usa o navegador, então só é carregado depois que a tela abre (a web é pré-renderizada).
export default function MapSurface({ focus, scope, onSelectArea }: MapSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const baseRef = useRef<LayerGroup | null>(null);
  const attributionRef = useRef<Control.Attribution | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  // Região aberta e a função que redesenha bairros e nomes; usadas pelos eventos do Leaflet.
  const openAreaRef = useRef<string | undefined>(undefined);
  const updateDetailRef = useRef<(() => void) | null>(null);
  const onSelectAreaRef = useRef(onSelectArea);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onSelectAreaRef.current = onSelectArea;
  }, [onSelectArea]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leafletModule = await import('leaflet');
      // O Leaflet é um módulo CommonJS: dependendo do empacotador, a API vem direto ou em "default".
      const L = leafletModule.default ?? leafletModule;
      if (cancelled || !containerRef.current) {
        return;
      }

      // Mantém a tela dentro do Recife: a borda do mapa para no limite da cidade.
      const recifeBounds = L.latLngBounds(
        [RECIFE_BOUNDS.south, RECIFE_BOUNDS.west],
        [RECIFE_BOUNDS.north, RECIFE_BOUNDS.east],
      );
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: RECIFE_MIN_ZOOM,
        maxBounds: recifeBounds,
        maxBoundsViscosity: 1,
      });
      // Abre mostrando o Recife inteiro, descontando a busca no topo e o botão de foto embaixo.
      map.fitBounds(recifeBounds, {
        paddingTopLeft: [RECIFE_FIT_PADDING.left, RECIFE_FIT_PADDING.top],
        paddingBottomRight: [RECIFE_FIT_PADDING.right, RECIFE_FIT_PADDING.bottom],
      });

      leafletRef.current = L;
      mapRef.current = map;
      attributionRef.current = L.control.attribution({ prefix: false }).addTo(map);
      baseRef.current = L.layerGroup().addTo(map);
      layersRef.current = L.layerGroup().addTo(map);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Mapa realista com o entorno do Recife esmaecido, para os dois perfis. Cidadãos veem por cima as
  // regiões do Recife e, ao abrir uma região (ou de perto), os bairros.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const base = baseRef.current;
    const attribution = attributionRef.current;
    if (!L || !map || !base || !attribution) {
      return;
    }

    const showsRegions = scope === 'bairro';
    map.setMaxZoom(showsRegions ? BAIRRO_MAX_ZOOM : OSM_MAX_ZOOM);
    base.clearLayers();
    L.tileLayer(MAP_TILE_URL, { maxZoom: OSM_MAX_ZOOM }).addTo(base);
    attribution.removeAttribution(MAP_ATTRIBUTION).addAttribution(MAP_ATTRIBUTION);

    // Fora do Recife, o mapa fica esmaecido, para a cidade ser o destaque.
    L.polygon([toLatLngs(OUTSIDE_RECIFE_MASK), toLatLngs(RECIFE_OUTLINE)], {
      stroke: false,
      fillColor: OUTSIDE_RECIFE_FILL,
      fillOpacity: 1,
      interactive: false,
    }).addTo(base);

    if (!showsRegions) {
      return;
    }

    const label = (position: [number, number], html: string) =>
      L.marker([position[1], position[0]], {
        icon: L.divIcon({ html, className: '', iconSize: [0, 0] }),
        interactive: false,
        keyboard: false,
      });

    const areaLabels = RECIFE_MICRORREGIOES.map((micro) => ({
      marker: label(micro.label, microLabelHtml(micro.nome)),
      nome: micro.nome,
      lonSpan: lonSpanOf(micro.rings),
      area: micro.codigo,
    }));
    const bairros = RECIFE_BAIRROS.map((bairro) => ({
      polygon: L.polygon(bairro.rings.map(swap), {
        color: BAIRRO_BORDER,
        weight: 1,
        fillColor: BAIRRO_FILL,
        fillOpacity: 1,
        interactive: false,
      }),
      marker: label(bairro.label, bairroLabelHtml(bairro.nome)),
      nome: bairro.nome,
      lonSpan: lonSpanOf(bairro.rings),
      area: areaDoBairro(bairro.nome),
    }));

    for (const micro of RECIFE_MICRORREGIOES) {
      const polygon = L.polygon(micro.rings.map(swap), {
        color: MICRO_BORDER,
        weight: 1,
        fillColor: MICRO_FILL,
        fillOpacity: 1,
      }).addTo(base);
      // Clicar numa região abre os bairros que a compõem.
      polygon.on('click', () => onSelectAreaRef.current?.(focusForArea(micro)));
    }

    // Afastado, mostra os nomes das regiões e os bairros da região aberta; de perto, todos os bairros.
    // Só aparecem os nomes das áreas grandes o bastante na tela para eles.
    const updateDetail = () => {
      const showsDetail = map.getZoom() >= BAIRRO_DETAIL_ZOOM;
      const openArea = openAreaRef.current;
      const bounds = map.getBounds();
      const pxPerDegree = map.getSize().x / (bounds.getEast() - bounds.getWest());
      const show = (layer: Parameters<typeof base.addLayer>[0], visible: boolean) => {
        if (visible) {
          base.addLayer(layer);
        } else {
          base.removeLayer(layer);
        }
      };

      for (const area of areaLabels) {
        const visible = !showsDetail && area.area !== openArea;
        show(area.marker, visible && labelFits(area.nome, area.lonSpan * pxPerDegree));
      }
      for (const bairro of bairros) {
        const visible = showsDetail || (openArea !== undefined && bairro.area === openArea);
        show(bairro.polygon, visible);
        show(bairro.marker, visible && labelFits(bairro.nome, bairro.lonSpan * pxPerDegree));
      }
    };
    updateDetailRef.current = updateDetail;
    updateDetail();
    map.on('zoomend', updateDetail);

    return () => {
      map.off('zoomend', updateDetail);
      updateDetailRef.current = null;
    };
  }, [scope, isReady]);

  useEffect(() => {
    openAreaRef.current = focus?.area;
    updateDetailRef.current?.();
  }, [focus, isReady]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!L || !map || !layers) {
      return;
    }

    layers.clearLayers();
    if (!focus) {
      return;
    }

    const padding = { paddingTopLeft: PADDING_TOP_LEFT, paddingBottomRight: PADDING_BOTTOM_RIGHT };

    if (focus.outline?.length) {
      const polygon = L.polygon(focus.outline.map(toLatLngs), {
        color: AppColors.actionBlue,
        weight: 2.5,
        fillColor: AppColors.actionBlue,
        fillOpacity: 0.16,
      }).addTo(layers);
      map.flyToBounds(polygon.getBounds(), padding);
      return;
    }

    const { latitude, longitude, latitudeDelta, longitudeDelta } = focus;
    map.flyToBounds(
      [
        [latitude - latitudeDelta / 2, longitude - longitudeDelta / 2],
        [latitude + latitudeDelta / 2, longitude + longitudeDelta / 2],
      ],
      padding,
    );

    if (focus.scope === 'rua') {
      L.marker([latitude, longitude], {
        title: focus.title,
        icon: L.divIcon({ html: PIN_HTML, className: '', iconSize: [38, 50], iconAnchor: [19, 50] }),
      }).addTo(layers);
    }
  }, [focus, isReady]);

  async function handleLocateMe() {
    const coords = await Gps.getCurrentLocation();
    if (!coords) {
      return;
    }

    if (!isInsideRecife(coords)) {
      const { south, west, north, east } = RECIFE_BOUNDS;
      mapRef.current?.flyToBounds([
        [south, west],
        [north, east],
      ]);
      return;
    }

    mapRef.current?.flyTo([coords.latitude, coords.longitude], scope === 'rua' ? 16 : BAIRRO_MAX_ZOOM);
  }

  return (
    <>
      <View style={styles.map}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: MAP_BACKGROUND }} />
      </View>

      <MapLocateButton onPress={handleLocateMe} />
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
});
