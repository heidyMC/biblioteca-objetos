"use client"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const HomePage = () => {
  const router = useRouter()

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#2d2d2d", "#3d3d3d", "#5a5a5a", "#e8e8e8"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Logo marca */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>BIBLIOTECA</Text>
            </View>

            {/* Título principal hero */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Bibleoteca de objetos</Text>

            </View>

            {/* Descripción principal */}
            <Text style={styles.description}>
              Accede a lo que necesitas con tokens. La plataforma que conecta personas y objetos de forma directa.
            </Text>

            {/* Imagen principal con efecto */}
            <View style={styles.imageContainer}>
              <View style={styles.imageGlow} />
              <Image
                source={require("../../assets/images/login-images.png")}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Características rápidas */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Gana tokens compartiendo</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Alquila de forma segura</Text>
              </View>
      
            </View>

            {/* Botones principales */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/(tabs)/register")}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Registrarse →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push("/(tabs)/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>

            {/* Footer text */}
            <Text style={styles.footerText}>Únete a cientos de usuarios que ya forman parte de la comunidad</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  )
}

export default HomePage

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 3,
    opacity: 0.9,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "bold",
    lineHeight: 52,
    letterSpacing: -1,
  },
  description: {
    color: "#d4d4d4",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: "90%",
    opacity: 0.95,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
    position: "relative",
  },
  imageGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#ffffff",
    opacity: 0.05,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  image: {
    width: 260,
    height: 260,
    opacity: 0.95,
  },
  featuresContainer: {
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    opacity: 0.6,
  },
  featureText: {
    color: "#b8b8b8",
    fontSize: 14,
  },
  buttonContainer: {
    gap: 14,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#1E90FF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1E90FF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    color: "#888888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.7,
  },
})
