import type { UserRole } from '@/src/types';

import { RECIFE_BAIRROS, type RecifeBairro } from './recife-bairros';
import { RECIFE_BOUNDARY, RECIFE_BOUNDS } from './recife-boundary';
import { RECIFE_MICRORREGIOES, type RecifeMicrorregiao } from './recife-microrregioes';
import { RMR_CIDADES, RMR_TERRA, type RmrCidade } from './rmr-cidades';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

// "bairro" para cidadãos e "rua" para agentes da prefeitura.
export type MapScope = 'bairro' | 'rua';

export type MapFocus = MapRegion & {
  scope: MapScope;
  title: string;
  subtitle: string;
  // Contorno do bairro (um anel por polígono), quando disponível.
  outline?: MapCoordinate[][];
  // Região (uma das 12 áreas do Recife) aberta no mapa: mostra os bairros que a compõem.
  area?: string;
  // Verdadeiro quando o foco é a própria região, e não um bairro ou rua dentro dela.
  isArea?: boolean;
};

export function getMapScope(role?: UserRole): MapScope {
  return role === 'agente' ? 'rua' : 'bairro';
}

// O app cobre apenas o município do Recife.
export {
  RECIFE_BAIRROS,
  RECIFE_BOUNDS,
  RECIFE_MICRORREGIOES,
  RMR_CIDADES,
  RMR_TERRA,
  type RecifeBairro,
  type RecifeMicrorregiao,
  type RmrCidade,
};

// Mapa dos cidadãos, sem ruas: mar, terra e cidades vizinhas em tons neutros, e o Recife em azul claro.
export const SEA_FILL = '#DCE8F5';
export const LAND_FILL = '#F1F2F4';
export const CITY_BORDER = '#C9CED6';
export const CITY_LABEL_COLOR = '#64748B';
// Áreas do Recife em azul translúcido, para o traçado das ruas aparecer por baixo.
export const MICRO_FILL = 'rgba(28, 100, 242, 0.08)';
export const MICRO_BORDER = '#8FB0EF';
export const BAIRRO_FILL = 'rgba(28, 100, 242, 0.05)';
export const BAIRRO_BORDER = 'rgba(28, 100, 242, 0.3)';

// Fora do Recife, o mapa fica esmaecido por uma película branca, para a cidade ser o destaque.
// Retângulo bem maior que o Recife, com o contorno da cidade como "furo".
export const OUTSIDE_RECIFE_MASK: MapCoordinate[] = [
  { latitude: -7.0, longitude: -36.0 },
  { latitude: -7.0, longitude: -34.0 },
  { latitude: -9.0, longitude: -34.0 },
  { latitude: -9.0, longitude: -36.0 },
];
export const OUTSIDE_RECIFE_FILL = 'rgba(248, 250, 252, 0.6)';
export const MAP_BACKGROUND = '#F2F2F0';

// Largura de uma área em graus de longitude, usada para decidir se o nome dela cabe na tela.
export function lonSpanOf(rings: [number, number][][]) {
  const longitudes = rings.flat().map(([longitude]) => longitude);
  return Math.max(...longitudes) - Math.min(...longitudes);
}

// O nome só aparece se a área estiver larga o bastante na tela para ele (cerca de 6,5 px por letra).
export function labelFits(nome: string, areaWidthPx: number) {
  return areaWidthPx >= nome.length * 6.5 + 12;
}

export const toMapCoordinates = (ring: [number, number][]): MapCoordinate[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

// Abre mostrando o Recife inteiro, com as microrregiões ocupando a tela.
export const RECIFE_REGION: MapRegion = {
  latitude: (RECIFE_BOUNDS.south + RECIFE_BOUNDS.north) / 2,
  longitude: (RECIFE_BOUNDS.west + RECIFE_BOUNDS.east) / 2,
  latitudeDelta: RECIFE_BOUNDS.north - RECIFE_BOUNDS.south,
  longitudeDelta: RECIFE_BOUNDS.east - RECIFE_BOUNDS.west,
};

// Contorno da cidade, usado para enquadrar o Recife inteiro na tela.
export const RECIFE_OUTLINE: MapCoordinate[] = RECIFE_BOUNDARY.map(([longitude, latitude]) => ({
  latitude,
  longitude,
}));

// Espaço livre ao enquadrar a cidade: a busca no topo, o botão de foto embaixo e uma margem dos
// lados para aparecerem as cidades vizinhas em volta do Recife.
export const RECIFE_FIT_PADDING = { top: 110, right: 44, bottom: 120, left: 44 };

// Verifica se o ponto está dentro de um contorno [longitude, latitude] (algoritmo de ray casting).
function isInsideRing(ring: [number, number][], { latitude, longitude }: MapCoordinate) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > latitude !== yj > latitude && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

export function isInsideRecife(point: MapCoordinate) {
  return isInsideRing(RECIFE_BOUNDARY, point);
}

export function findBairro(point: MapCoordinate): RecifeBairro | undefined {
  return RECIFE_BAIRROS.find((bairro) => bairro.rings.some((ring) => isInsideRing(ring, point)));
}

// Região (uma das 12 áreas) onde fica cada bairro, pelo ponto interno do bairro.
const AREA_DO_BAIRRO = new Map(
  RECIFE_BAIRROS.map((bairro) => {
    const point = { latitude: bairro.label[1], longitude: bairro.label[0] };
    const area = RECIFE_MICRORREGIOES.find((micro) => micro.rings.some((ring) => isInsideRing(ring, point)));
    return [bairro.nome, area?.codigo] as const;
  }),
);

export function areaDoBairro(nome: string) {
  return AREA_DO_BAIRRO.get(nome);
}

// Foco de uma região: enquadra a região inteira e mostra os bairros que a compõem.
export function focusForArea(area: RecifeMicrorregiao): MapFocus {
  const outline = area.rings.map(toMapCoordinates);
  const points = outline.flat();
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const quantidade = RECIFE_BAIRROS.filter((bairro) => AREA_DO_BAIRRO.get(bairro.nome) === area.codigo).length;

  return {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    latitudeDelta: Math.max(...latitudes) - Math.min(...latitudes),
    longitudeDelta: Math.max(...longitudes) - Math.min(...longitudes),
    scope: 'bairro',
    title: area.nome,
    subtitle: `${quantidade} ${quantidade === 1 ? 'bairro' : 'bairros'} · ${area.rpa}`,
    outline,
    area: area.codigo,
    isArea: true,
  };
}

// Mantém o mapa no Recife sem atrapalhar a navegação: só o centro da tela precisa ficar dentro
// do retângulo da cidade, então dá para chegar livremente até as bordas. Fora disso, volta para o
// ponto mais próximo dentro do limite.
export function clampRegionToRecife(region: MapRegion): MapRegion {
  return {
    ...region,
    latitude: Math.min(Math.max(region.latitude, RECIFE_BOUNDS.south), RECIFE_BOUNDS.north),
    longitude: Math.min(Math.max(region.longitude, RECIFE_BOUNDS.west), RECIFE_BOUNDS.east),
  };
}

// Área de busca de endereços: o retângulo que contém o Recife (oeste, norte, leste, sul).
export const RECIFE_SEARCH_VIEWBOX = [
  RECIFE_BOUNDS.west,
  RECIFE_BOUNDS.north,
  RECIFE_BOUNDS.east,
  RECIFE_BOUNDS.south,
].join(',');

const STADIA_API_KEY = process.env.EXPO_PUBLIC_STADIA_API_KEY;

// Estilo claro e minimalista Alidade Smooth da Stadia Maps (dados do OpenStreetMap), em alta resolução.
// Sem a chave no .env, usa o estilo humanitário (HOT) do OpenStreetMap, que não exige cadastro.
export const MAP_TILE_URL = STADIA_API_KEY
  ? `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png?api_key=${STADIA_API_KEY}`
  : 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

export const OSM_MAX_ZOOM = 19;

// Zoom mínimo: o suficiente para ver o Recife inteiro, sem afastar até a região ao redor.
export const RECIFE_MIN_ZOOM = 11;

// Mapa dos cidadãos: afastado, mostra as 18 microrregiões; a partir deste zoom, mostra também os bairros.
export const BAIRRO_DETAIL_ZOOM = 14;
// O mesmo limite expresso como largura visível em graus (react-native-maps trabalha com regiões, não com zoom).
export const BAIRRO_DETAIL_DELTA = 0.035;

// Zoom máximo para cidadãos: dá para ver os bairros de perto, mas o mapa não tem ruas.
export const BAIRRO_MAX_ZOOM = 15;

// Mapa dos cidadãos: desenhado pelo app com os limites do OpenStreetMap e os bairros da Prefeitura do Recife.
export const CIDADES_ATTRIBUTION = STADIA_API_KEY
  ? '© Stadia Maps © Stamen © OpenStreetMap · Prefeitura do Recife'
  : '© OpenStreetMap · Prefeitura do Recife';

// Mapa dos cidadãos: só o traçado das ruas (sem nomes), bem suave por cima da terra.
// Sem a chave da Stadia no .env, o mapa dos cidadãos fica sem o traçado.
export const STREET_LINES_URL = STADIA_API_KEY
  ? `https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}@2x.png?api_key=${STADIA_API_KEY}`
  : null;
export const STREET_LINES_OPACITY = 0.12;

export const MAP_ATTRIBUTION = STADIA_API_KEY
  ? '© Stadia Maps © OpenMapTiles © OpenStreetMap'
  : '© OpenStreetMap contributors · HOT';
