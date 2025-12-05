import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function GoogleAuthHandle() {
  const router = useRouter();

  useEffect(() => {
    // Esta pantalla solo sirve para capturar el redirect de Google.
    // La lógica de supabase en login.tsx detectará la sesión.
    // Si el usuario cae aquí por error, lo mandamos al home.
    const timer = setTimeout(() => {
       // Intentamos ir al home, si la sesión ya está activa, funcionará.
       // Si no, el layout redirigirá al login.
       router.replace('/(tabs)/HomeMenu/mainScreen');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}