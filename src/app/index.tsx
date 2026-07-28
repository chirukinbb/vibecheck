// src/app/index.tsx — редирект на табы
import {Redirect} from 'expo-router';

export default function IndexScreen() {
  return <Redirect href="/(tabs)"/>;
}
