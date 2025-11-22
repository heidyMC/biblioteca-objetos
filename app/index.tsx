// app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // 1. Verificar si ya hay un usuario logueado
      const userData = await AsyncStorage.getItem('usuario');
      if (userData) {
        // Si hay usuario, vamos directo al Home principal
        router.replace('/(tabs)/HomeMenu/mainScreen');
        return;
      }

      // 2. Verificar si ya vio el onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      
      if (hasSeenOnboarding === 'true') {
        // Si ya lo vio pero no está logueado, vamos al Login
        router.replace('/(auth)/login');
      } else {
        // Si es la primera vez, vamos al Onboarding
        router.replace('../onboarding' as any);
      }
    } catch (error) {
      console.error('Error checking launch state:', error);
      // En caso de error, mandamos al login por seguridad
      router.replace('/(auth)/login');
    } finally {
      setIsChecking(false);
    }
  };

  // Mientras verifica, mostramos un spinner
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}