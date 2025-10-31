"use client"

import TextComponent from "@/components/ui/text-component"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
interface Usuario {
  id: string
  nombre: string
  correo: string
  foto_url: string
  tokens_disponibles: number
}

interface Categoria {
  id: string
  nombre: string
}

interface Producto {
  id: string
  nombre: string
  precio_tokens_dia: number
  calificacion_promedio: number
  disponible: boolean
  imagen_url: string
  categorias?: { nombre: string }
}

export default function MainScreen() {
  return <ScrollView />
}
