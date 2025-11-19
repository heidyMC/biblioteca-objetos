import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

type Referido = {
  id: string;
  nombre: string;
  fecha_registro: string;
  tokens_ganados: number;
};

// Componente Skeleton para loading
const SkeletonLoader = () => (
  <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <View style={[styles.skeleton, { width: 24, height: 24, borderRadius: 12 }]} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <View style={[styles.skeleton, { width: 200, height: 28, borderRadius: 8 }]} />
          <View style={[styles.skeleton, { width: 180, height: 16, borderRadius: 6, marginTop: 4 }]} />
        </View>
      </View>

      {/* Tarjeta de compartir Skeleton */}
      <View style={styles.shareCard}>
        <View style={styles.shareHeader}>
          <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 16 }]} />
          <View style={styles.shareTexts}>
            <View style={[styles.skeleton, { width: '80%', height: 20, borderRadius: 6 }]} />
            <View style={[styles.skeleton, { width: '95%', height: 16, borderRadius: 4, marginTop: 8 }]} />
          </View>
        </View>

        <View style={styles.referralLinkBox}>
          <View style={[styles.skeleton, { width: 150, height: 16, borderRadius: 6 }]} />
          <View style={[styles.skeleton, { width: 120, height: 28, borderRadius: 8, marginTop: 8 }]} />
        </View>

        <View style={[styles.skeleton, { height: 48, borderRadius: 12 }]} />
      </View>

      {/* Lista de referidos Skeleton */}
      <View style={styles.referralsSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.skeleton, { width: 20, height: 20, borderRadius: 10 }]} />
          <View style={[styles.skeleton, { width: 120, height: 20, borderRadius: 6 }]} />
        </View>

        <View style={[styles.skeleton, { height: 48, borderRadius: 12 }]} />

        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.referralItem}>
            <View style={[styles.skeleton, { width: 48, height: 48, borderRadius: 24 }]} />
            <View style={styles.referralInfo}>
              <View style={[styles.skeleton, { width: '70%', height: 18, borderRadius: 6 }]} />
              <View style={[styles.skeleton, { width: '50%', height: 14, borderRadius: 4, marginTop: 6 }]} />
            </View>
            <View style={[styles.skeleton, { width: 80, height: 32, borderRadius: 12 }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// ⬆️ HASTA AQUÍ TERMINA EL COMMIT 1

// Los estilos se quedan completos porque se usan desde el SkeletonLoader
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#737373",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    padding: 16,
  },
  headerTexts: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  // ... (mantén TODOS los estilos que ya tenías,
  //      no borres nada porque los siguientes commits los usarán)
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  referralInfo: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
});
