import { Platform } from 'react-native';

import {
  areaDoBairro,
  findBairro,
  isInsideRecife,
  RECIFE_SEARCH_VIEWBOX,
  toMapCoordinates,
  type MapCoordinate,
  type MapFocus,
  type MapScope,
} from '@/constants/map';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// A política de uso do Nominatim permite no máximo 1 requisição por segundo.
const MIN_INTERVAL_MS = 1100;

// Ruas costumam ter uma área muito pequena; garante um zoom confortável no mapa.
const MIN_RUA_DELTA = 0.006;
const FALLBACK_BAIRRO_DELTA = 0.03;

// Zoom 14 no reverse do Nominatim corresponde ao nível de bairro.
const BAIRRO_REVERSE_ZOOM = '14';
const BAIRRO_TYPES = ['suburb', 'neighbourhood', 'quarter', 'city_district'];

// Busca alguns resultados para descartar os que ficam fora do Recife (o retângulo de busca
// também cobre pedaços de Olinda e Jaboatão).
const SEARCH_LIMIT = '5';

type BoundingBox = [string, string, string, string];

type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
};

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }
  | { type: string; coordinates: unknown };

type NominatimPlace = {
  lat: string;
  lon: string;
  name: string;
  addresstype: string;
  boundingbox: BoundingBox;
  address?: NominatimAddress;
  geojson?: GeoJsonGeometry;
};

let lastRequestAt = 0;

async function nominatimFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();

  const query = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'pt-BR', ...params });

  // Navegadores não permitem alterar o User-Agent; na web o Nominatim identifica o app pelo Referer.
  const headers: Record<string, string> =
    Platform.OS === 'web' ? {} : { 'User-Agent': 'VetorRisco/1.0 (projeto academico UFRPE)' };

  const response = await fetch(`${NOMINATIM_URL}/${path}?${query.toString()}`, { headers });

  if (!response.ok) {
    throw new Error(`Falha na busca de endereço (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

function regionFromBoundingBox(boundingbox: BoundingBox, minDelta: number) {
  const [south, north, west, east] = boundingbox.map(Number);

  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
    latitudeDelta: Math.max(north - south, minDelta),
    longitudeDelta: Math.max(east - west, minDelta),
  };
}

function outlineFromGeoJson(geojson?: GeoJsonGeometry): MapCoordinate[][] | undefined {
  const toRing = (ring: number[][]) => ring.map(([longitude, latitude]) => ({ latitude, longitude }));

  if (geojson?.type === 'Polygon') {
    return [toRing((geojson.coordinates as number[][][])[0])];
  }

  if (geojson?.type === 'MultiPolygon') {
    return (geojson.coordinates as number[][][][]).map((polygon) => toRing(polygon[0]));
  }

  return undefined;
}

function pointOf(place: NominatimPlace): MapCoordinate {
  return { latitude: Number(place.lat), longitude: Number(place.lon) };
}

function regionFromRings(rings: MapCoordinate[][]) {
  const points = rings.flat();
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const [south, north] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [west, east] = [Math.min(...longitudes), Math.max(...longitudes)];

  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
    latitudeDelta: Math.max(north - south, FALLBACK_BAIRRO_DELTA / 3),
    longitudeDelta: Math.max(east - west, FALLBACK_BAIRRO_DELTA / 3),
  };
}

async function buscarBairro(place: NominatimPlace): Promise<MapFocus> {
  // Usa os mesmos bairros desenhados no mapa; só consulta o Nominatim se o ponto não cair em nenhum.
  const local = findBairro(pointOf(place));
  if (local) {
    const outline = local.rings.map(toMapCoordinates);
    return {
      ...regionFromRings(outline),
      scope: 'bairro',
      title: local.nome,
      subtitle: 'Recife',
      outline,
      area: areaDoBairro(local.nome),
    };
  }

  const bairro = await nominatimFetch<NominatimPlace | { error: string }>('reverse', {
    lat: place.lat,
    lon: place.lon,
    zoom: BAIRRO_REVERSE_ZOOM,
    addressdetails: '1',
    polygon_geojson: '1',
    polygon_threshold: '0.0001',
  });

  if ('error' in bairro || !BAIRRO_TYPES.includes(bairro.addresstype)) {
    return {
      ...pointOf(place),
      latitudeDelta: FALLBACK_BAIRRO_DELTA,
      longitudeDelta: FALLBACK_BAIRRO_DELTA,
      scope: 'bairro',
      title: place.address?.suburb ?? place.address?.neighbourhood ?? place.name,
      subtitle: 'Recife',
    };
  }

  return {
    ...regionFromBoundingBox(bairro.boundingbox, FALLBACK_BAIRRO_DELTA),
    scope: 'bairro',
    title: bairro.name,
    subtitle: 'Recife',
    outline: outlineFromGeoJson(bairro.geojson),
  };
}

/**
 * Busca um endereço no Nominatim (OpenStreetMap), apenas dentro do município do Recife.
 * Com o escopo "bairro" (cidadãos), devolve o bairro onde o endereço fica, com seu contorno.
 * Com o escopo "rua" (agentes da prefeitura), devolve a própria rua.
 * Só deve ser chamada quando o usuário confirmar a busca, nunca a cada tecla digitada.
 */
export async function buscarEndereco(texto: string, scope: MapScope): Promise<MapFocus | null> {
  const resultados = await nominatimFetch<NominatimPlace[]>('search', {
    q: texto,
    limit: SEARCH_LIMIT,
    addressdetails: '1',
    countrycodes: 'br',
    viewbox: RECIFE_SEARCH_VIEWBOX,
    bounded: '1',
  });

  const place = resultados.find((resultado) => isInsideRecife(pointOf(resultado)));

  if (!place) {
    return null;
  }

  if (scope === 'bairro') {
    return buscarBairro(place);
  }

  const bairro = place.address?.suburb ?? place.address?.neighbourhood;

  return {
    ...regionFromBoundingBox(place.boundingbox, MIN_RUA_DELTA),
    ...pointOf(place),
    scope: 'rua',
    title: place.name || place.address?.road || texto,
    subtitle: [bairro, 'Recife'].filter(Boolean).join(', '),
  };
}
