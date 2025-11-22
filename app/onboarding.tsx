// app/onboarding.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Definimos la interfaz para los datos de cada slide
interface SlideItem {
  id: string;
  title: string;
  description: string;
  // Cambiamos 'icon' y 'color' por 'image'
  image: ImageSourcePropType; 
}

const SLIDES: SlideItem[] = [
  {
    id: '1',
    title: 'Bienvenido a PrestaFacil',
    description: 'Alquila lo que necesites usando tokens. Una forma fácil y rápida de acceder a objetos sin comprarlos.',
    // Asegúrate de que esta imagen exista en tu carpeta assets/images
    image: require('../assets/images/onboarding_welcome.png'),
  },
  {
    id: '2',
    title: 'Variedad de Objetos',
    description: 'Desde herramientas esenciales hasta lo último en entretenimiento como PS5 y Xbox Series X. ¡Todo en un solo lugar!',
    // ¡AQUÍ VA TU IMAGEN REAL DE LAS CONSOLAS!
    // Asegúrate de que esta imagen exista en tu carpeta assets/images
    image: require('../assets/images/onboarding_variety_ps5.png'),
  },
  {
    id: '3',
    title: 'Gana Más Tokens',
    description: 'Completa misiones y devuelve tus alquileres a tiempo para ganar más tokens y acceder a mejores objetos.',
    // Asegúrate de que esta imagen exista en tu carpeta assets/images
    image: require('../assets/images/onboarding_tokens.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('Error guardando onboarding:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
            ref={flatListRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
            }}
            renderItem={({ item }) => (
            <View style={styles.slide}>
                {/* SECCIÓN DE IMAGEN */}
                <View style={styles.imageContainer}>
                    <Image 
                        source={item.image} 
                        style={styles.onboardingImage} 
                        // 'contain' asegura que se vea toda la imagen sin recortarse. 
                        // Si prefieres que llene el espacio, usa 'cover'.
                        resizeMode="contain" 
                    />
                </View>
                {/* SECCIÓN DE TEXTO */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
            )}
        />
      </View>

      {/* SECCIÓN INFERIOR (Paginación y Botón) */}
      <View style={styles.bottomSection}>
        {/* Indicadores (Puntitos) */}
        <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
            <View
                key={index}
                style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
                ]}
            />
            ))}
        </View>

        {/* Botón Siguiente / Comenzar */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
            </Text>
            <Ionicons 
            name={currentIndex === SLIDES.length - 1 ? "checkmark-circle" : "arrow-forward-circle"} 
            size={24} 
            color="#fff" 
            />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    flex: 0.75, // El carrusel ocupa el 75% superior
  },
  slide: {
    width,
    // height: height * 0.75, // Asegura que el slide ocupe el espacio asignado
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    flex: 0.65, // La imagen ocupa más espacio que antes
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  // ESTILO NUEVO PARA LAS IMÁGENES REALES
  onboardingImage: {
    width: width * 0.85, // 85% del ancho de la pantalla
    height: width * 0.75, // Un poco menos de altura para mantener proporción rectangular
  },
  textContainer: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800', // Un poco más grueso
    color: '#1E293B',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  // Estilos de la parte inferior
  bottomSection: {
    flex: 0.25, // El 25% inferior para controles
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#6366F1',
    width: 24, // El punto activo se estira
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 16, // Bordes más redondeados
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});