"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect /*, useRouter*/ } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import { ScrollView } from "react-native"
import { supabase } from "@/lib/supabase"
// Estos dos se usarán en commits posteriores (puedes dejarlos o quitarlos por ahora):
// import TextComponent from "@/components/ui/text-component"
// import { Ionicons } from "@expo/vector-icons"

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
  categorias?: {
    nombre: string
  }
}

const MainScreen = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todas")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  // const router = useRouter() // se usará cuando agreguemos navegación en commits siguientes

  // Commit 4 — Cargar usuario desde AsyncStorage al enfocar
  useFocusEffect(
    useCallback(() => {
      const cargarUsuario = async () => {
        try {
          const userData = await AsyncStorage.getItem("usuario")
          if (userData) setUsuario(JSON.parse(userData))
          else setUsuario(null)
        } catch (error) {
          console.error("Error cargando usuario:", error)
        }
      }
      cargarUsuario()
    }, []),
  )

  // Commit 5 — Traer objetos y categorías desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: productosData, error: errorProductos } = await supabase
        .from("objetos")
        .select(`
          *,
          categorias (
            nombre
          )
        `)

      if (errorProductos) {
        console.error("Error cargando productos:", errorProductos.message)
      } else {
        setProductos(productosData || [])
      }

      const { data: categoriasData, error: errorCategorias } = await supabase
        .from("categorias")
        .select("id, nombre")

      if (errorCategorias) {
        console.error("Error cargando categorías:", errorCategorias.message)
      } else {
        setCategorias(categoriasData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [])
// dentro del componente, antes del return
const productosFiltrados = productos.filter((item) => {
  const matchSearch = item.nombre.toLowerCase().includes(search.toLowerCase())
  const matchCategoria = categoriaSeleccionada === "todas" || item.categorias?.nombre === categoriaSeleccionada
  return matchSearch && matchCategoria
})

const getCategoriaDisplay = () => {
  if (categoriaSeleccionada === "todas") return "📦 Todas las categorías"
  return categoriaSeleccionada
}

  
  return <ScrollView />
}

export default MainScreen
