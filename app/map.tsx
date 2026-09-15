import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapSurface from '@/components/map-surface';
import { Camera } from '@/components/camera';
import { styles } from '@/constants/style';
import { Profile } from '@/components/profile';
import { Search } from '@/components/search';
import { useAuth } from '@/src/contexts/auth-context';

export default function MapRoute() {
  const { usuario, carregando } = useAuth();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.mapSurface}>
          <MapSurface />

          <View style={styles.topControls}>
            <Search />
            <Profile />
          </View>

          <Camera />
        </View>
      </View>
    </SafeAreaView>
  );
}
