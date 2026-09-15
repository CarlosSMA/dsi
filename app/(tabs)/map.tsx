import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapSurface from '@/components/map-surface';
import { Camera } from '@/components/camera';
import { styles } from '@/constants/style';
import { Profile } from '@/components/profile';
import { Search } from '@/components/search';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.mapSurface}>
          <MapSurface/>

          <View style={styles.topControls}>
            <Search></Search>
            <Profile></Profile>
          </View>

          <Camera></Camera>
        </View>
      </View>
    </SafeAreaView>
  );
}
