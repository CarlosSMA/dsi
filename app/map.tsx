import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapResultCard } from '@/components/map-result-card';
import MapSurface from '@/components/map-surface';
import { PhotoReportEntry } from '@/components/photo-report-entry';
import { getMapScope, type MapFocus } from '@/constants/map';
import { styles } from '@/constants/style';
import { Profile } from '@/components/profile';
import { Search } from '@/components/search';
import { useAuth } from '@/src/contexts/auth-context';

export default function MapRoute() {
  const { usuario, carregando } = useAuth();
  const [focus, setFocus] = useState<MapFocus | null>(null);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.mapSurface}>
          <MapSurface focus={focus} scope={scope} onSelectArea={setFocus} />

          <View style={styles.topControls}>
            <Search scope={scope} onResult={setFocus} />
            <Profile />
          </View>

          {focus ? <MapResultCard focus={focus} onClose={() => setFocus(null)} /> : null}

          <PhotoReportEntry />
        </View>
      </View>
    </SafeAreaView>
  );
}
