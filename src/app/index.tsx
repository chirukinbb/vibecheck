// src/app/index.tsx — редирект по авторизации
import {useAuthStore} from '@/stores/authStore';
import {Redirect} from 'expo-router';

export default function IndexScreen() {
  const {isAuthenticated, isLoading} = useAuthStore();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'}/>;
}
