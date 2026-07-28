// src/app/(auth)/_layout.tsx — layout группы авторизации
import {Stack} from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{headerShown: false}}/>;
}
