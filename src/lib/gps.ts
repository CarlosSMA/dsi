import * as Location from 'expo-location';
import { Alert } from "react-native";

export class Gps {
  static async getCurrentLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Localização necessária',
        'Permita o acesso à localização para registrar uma ocorrência com suas coordenadas.'
      );
      return null;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      return currentLocation.coords;
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert(
        'Localização indisponível',
        'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.'
      );
      return null;
    }
  }
}
