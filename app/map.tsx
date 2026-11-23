import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapResultCard } from '@/components/map-result-card';
import { MapaRiscoLegenda } from '@/components/mapa-risco-legenda';
import MapSurface from '@/components/map-surface';
import { PhotoReportEntry } from '@/components/photo-report-entry';
import { RiscoRegiaoCard } from '@/components/risco-regiao-card';
import { getMapScope, type MapFocus } from '@/constants/map';
import { styles } from '@/constants/style';
import { Profile } from '@/components/profile';
import { Search } from '@/components/search';
import { useAuth } from '@/src/contexts/auth-context';
import { useRiscoRegioes } from '@/src/features/map/useRiscoRegioes';

export default function MapRoute() {
  const { usuario, carregando } = useAuth();
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const risco = useRiscoRegioes(Boolean(usuario));
  // Bairro cuja bolinha do mosquito foi tocada, para mostrar o aviso de risco dele.
  const [bairroRisco, setBairroRisco] = useState<string | null>(null);

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2167E8" />
      </View>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  const scope = getMapScope(usuario.role);
  const nivelBairroRisco = bairroRisco ? risco?.bairros.get(bairroRisco) : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.mapSurface}>
          <MapSurface
            focus={focus}
            scope={scope}
            onSelectArea={(area) => {
              setBairroRisco(null);
              setFocus(area);
            }}
            risco={risco}
            onSelectRisco={setBairroRisco}
          />

          <View style={styles.topControls}>
            <Search scope={scope} onResult={setFocus} />
            <Profile />
          </View>

          {/* O aviso da bolinha do mosquito ocupa o lugar do card do resultado enquanto estiver aberto. */}
          {bairroRisco && nivelBairroRisco ? (
            <RiscoRegiaoCard bairro={bairroRisco} nivel={nivelBairroRisco} onClose={() => setBairroRisco(null)} />
          ) : focus ? (
            <MapResultCard focus={focus} onClose={() => setFocus(null)} />
          ) : null}

          {/* Legenda das cores do mapa, só quando há dados de risco para colorir as regiões. */}
          {risco ? <MapaRiscoLegenda /> : null}

          <PhotoReportEntry />
        </View>
      </View>
    </SafeAreaView>
  );
}
