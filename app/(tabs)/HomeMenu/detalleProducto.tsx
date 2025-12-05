"use client";

import TextComponent from "@/components/ui/text-component";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  foto_url: string;
  tokens_disponibles: number;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio_tokens_dia: number;
  calificacion_promedio: number;
  disponible: boolean;
  imagen_url: string;
  latitud?: number;
  longitud?: number;
  categorias?: {
    nombre: string;
    descripcion: string;
  };
}

interface CaracteristicaObjeto {
  id: string;
  objeto_id: string;
  nombre: string;
  valor: string;
}

interface ImagenObjeto {
  id: string;
  objeto_id: string;
  url: string;
  created_at: string;
}

interface Resenia {
  id: number;
  comentario: string;
  calificacion: number;
  created_at: string;
  usuarios: {
    nombre: string;
    foto_url: string;
  };
}

const { width } = Dimensions.get("window");

const DetalleProducto = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [objeto, setObjeto] = useState<Producto | null>(null);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaObjeto[]>([]);
  const [reseñas, setReseñas] = useState<Resenia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodasResenas, setMostrarTodasResenas] = useState(false);

  const [imagenesAdicionales, setImagenesAdicionales] = useState<ImagenObjeto[]>([]);
  const [paginaActual, setPaginaActual] = useState(0);
  
  // --- ESTADOS PARA FAVORITOS ---
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const productoId = searchParams.id as string | undefined;

  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [carouselWidth, setCarouselWidth] = useState(width);

  useFocusEffect(
    useCallback(() => {
      const cargarUsuario = async () => {
        try {
          const userData = await AsyncStorage.getItem("usuario");
          if (userData) {
            setUsuario(JSON.parse(userData));
          }
        } catch (e) {
          console.warn("Error recargando usuario:", e);
        }
      };

      cargarUsuario();
    }, []),
  );

  // --- FUNCIÓN: VERIFICAR SI ES FAVORITO ---
  const checkFavorite = async (userId: string, objId: string) => {
    try {
      const { data } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', userId)
        .eq('objeto_id', objId)
        .maybeSingle();
      
      setIsFavorite(!!data);
    } catch (e) {
      console.log("Error checking favorite:", e);
    }
  };

  // --- FUNCIÓN: AGREGAR/QUITAR FAVORITO ---
  const toggleFavorite = async () => {
    if (!usuario || !productoId) {
        Alert.alert("Atención", "Inicia sesión para guardar favoritos");
        return;
    }
    
    setFavLoading(true);
    try {
        if (isFavorite) {
            // Quitar de favoritos
            const { error } = await supabase
                .from('favoritos')
                .delete()
                .eq('usuario_id', usuario.id)
                .eq('objeto_id', productoId);
            
            if (error) throw error;
            setIsFavorite(false);
        } else {
            // Agregar a favoritos
            const { error } = await supabase
                .from('favoritos')
                .insert({ usuario_id: usuario.id, objeto_id: productoId });

            if (error) throw error;
            setIsFavorite(true);
        }
    } catch (error: any) {
        Alert.alert("Error", "No se pudo actualizar favoritos: " + error.message);
    } finally {
        setFavLoading(false);
    }
  };

  const fetchReseñas = async () => {
    const { data, error } = await supabase
      .from("resenia")
      .select(`
        id,
        comentario,
        calificacion,
        created_at,
        usuarios (
          nombre,
          foto_url
        )
      `)
      .eq("id_objeto", productoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener reseñas:", error.message);
    } else {
      const mapped = (data || []).map(
        (d: any): Resenia => ({
          id: d.id,
          comentario: d.comentario,
          calificacion: d.calificacion,
          created_at: d.created_at,
          usuarios: Array.isArray(d.usuarios) ? d.usuarios[0] : d.usuarios || { nombre: "", foto_url: "" },
        }),
      );
      setReseñas(mapped);
    }
  };

  const fetchImagenes = async () => {
    const { data, error } = await supabase
      .from("imagenes_objeto")
      .select("id, objeto_id, url, created_at")
      .eq("objeto_id", productoId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error al obtener imágenes:", error.message);
    } else {
      setImagenesAdicionales(data || []);
      setPaginaActual(0);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!productoId) return;
      setLoading(true);

      const { data: objetoData, error: errorObjeto } = await supabase
        .from("objetos")
        .select(
          `
          *,
          categorias (
            nombre,
            descripcion
          )
        `,
        )
        .eq("id", productoId)
        .single();

      const { data: caracteristicasData } = await supabase
        .from("caracteristicas_objeto")
        .select("*")
        .eq("objeto_id", productoId);

      if (!errorObjeto) {
        setObjeto(objetoData);
        setCaracteristicas(caracteristicasData || []);

        // Verificar si es favorito (si hay usuario logueado)
        const userData = await AsyncStorage.getItem("usuario");
        if (userData) {
            const u = JSON.parse(userData);
            checkFavorite(u.id, productoId);
        }
      } else {
        console.error("Error fetch objeto:", errorObjeto);
      }

      await fetchReseñas();
      await fetchImagenes();
      setLoading(false);
    };

    fetchData();
  }, [productoId]);

  const renderStars = (count: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TextComponent
          key={i}
          text={i <= count ? "★" : "☆"}
          textColor={i <= count ? "#FFD700" : "#D3D3D3"}
          textSize={16}
        />,
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const canRent = !!objeto && objeto.disponible === true;
  const resenasVisibles = mostrarTodasResenas ? reseñas : reseñas.slice(0, 3);
  const totalImages = 1 + imagenesAdicionales.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}} onPress={() => router.push("/(tabs)/Perfil/PerfilUsuario")}>
            <Image
              source={{
                uri: usuario?.foto_url || "https://placehold.co/100x100?text=Sin+Foto",
              }}
              style={styles.profileImage}
            />
             <View>
                <TextComponent text={usuario?.nombre || "Cargando..."} fontWeight="bold" textSize={16} />
                <TextComponent text={`💰 ${usuario?.tokens_disponibles ?? 0} tokens`} textSize={13} textColor="#555" />
            </View>
          </TouchableOpacity>
          
          {/* BOTÓN FAVORITOS */}
          <TouchableOpacity 
            onPress={toggleFavorite} 
            disabled={favLoading} 
            style={styles.favButton}
          >
            <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={28} 
                color={isFavorite ? "#EF4444" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : objeto ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={styles.carouselContainer}
            onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={carouselWidth}
              decelerationRate="fast"
              onScroll={(e) => {
                const page = Math.round(
                  e.nativeEvent.contentOffset.x / carouselWidth
                );
                setPaginaActual(page);
              }}
              scrollEventThrottle={16}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setFullscreenImage(objeto.imagen_url);
                  setFullscreenVisible(true);
                }}
              >
                <Image
                  source={{ uri: objeto.imagen_url }}
                  style={[styles.objetoImage, { width: carouselWidth }]}
                />
              </TouchableOpacity>

              {imagenesAdicionales.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    setFullscreenImage(img.url);
                    setFullscreenVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={[styles.objetoImage, { width: carouselWidth }]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {totalImages > 1 && (
              <View style={styles.pageIndicator}>
                <TextComponent
                  text={`${paginaActual + 1} / ${totalImages}`}
                  fontWeight="bold"
                  textColor="#fff"
                  textSize={14}
                />
              </View>
            )}
          </View>

          {objeto.categorias && (
            <View style={styles.categoryBadge}>
              <TextComponent text={`📂 ${objeto.categorias.nombre}`} fontWeight="bold" textSize={14} textColor="#1E90FF" />
            </View>
          )}

          <TextComponent text={objeto.nombre} fontWeight="bold" textSize={22} textColor="#1E293B" />
          <TextComponent
            text={`💰 ${objeto.precio_tokens_dia} tokens/día`}
            fontWeight="bold"
            textSize={16}
            textColor="#111"
            style={{ marginTop: 5 }}
          />
          {objeto.descripcion && <TextComponent text={objeto.descripcion} textSize={15} textColor="#444" style={{ marginTop: 8 }} />}

          {caracteristicas.length > 0 && (
            <View style={styles.caracteristicasCard}>
              <TextComponent text="📋 Características" fontWeight="bold" textSize={18} textColor="#1E293B" style={{ marginBottom: 10 }} />
              {caracteristicas.map((c) => (
                <View key={c.id} style={styles.caracteristicaItem}>
                  <TextComponent text={`• ${c.nombre}:`} textSize={14} fontWeight="bold" textColor="#374151" />
                  <TextComponent text={c.valor} textSize={14} textColor="#6B7280" style={{ marginLeft: 5 }} />
                </View>
              ))}
            </View>
          )}

          {objeto.latitud && objeto.longitud && (
            <View style={styles.mapContainer}>
              <TextComponent text="📍 Ubicación del Producto" fontWeight="bold" textSize={18} textColor="#1E293B" />
              <View style={styles.mapBox}>
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
                      <style>
                        body { margin: 0; padding: 0; }
                        #map { height: 100vh; width: 100vw; }
                      </style>
                    </head>
                    <body>
                      <div id="map"><\/div>
                      <script>
                        var map = L.map('map', {zoomControl: false}).setView([${objeto.latitud}, ${objeto.longitud}], 15);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                          maxZoom: 19,
                          attribution: '© OpenStreetMap'
                        }).addTo(map);
                        L.marker([${objeto.latitud}, ${objeto.longitud}]).addTo(map);
                      </script>
                    </body>
                    </html>
                  `}}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.alquilarButton, !canRent && styles.alquilarButtonDisabled]}
            onPress={() => {
              if (!canRent) return;
              router.push({
                pathname: '/(tabs)/rental-screen',
                params: { producto: JSON.stringify(objeto) },
              });
            }}
            activeOpacity={canRent ? 0.8 : 1}
            disabled={!canRent}
          >
            <TextComponent text={canRent ? "🔑 Alquilar" : "⛔ No disponible"} fontWeight="bold" textSize={18} textColor="#fff" />
          </TouchableOpacity>

          <TextComponent text="★ Reseñas" fontWeight="bold" textSize={20} textColor="#1E293B" style={{ marginTop: 20 }} />
          {reseñas.length === 0 ? (
            <TextComponent text="Aún no hay reseñas." textSize={14} textColor="#6B7280" />
          ) : (
            <>
              {resenasVisibles.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <Image source={{ uri: r.usuarios?.foto_url || "https://placehold.co/60x60" }} style={styles.reviewerPhoto} />
                  <View style={{ flex: 1 }}>
                    <TextComponent text={r.usuarios?.nombre || "Usuario"} fontWeight="bold" textSize={15} />
                    {renderStars(r.calificacion)}
                    <TextComponent text={r.comentario} textSize={14} textColor="#333" />
                    <TextComponent text={new Date(r.created_at).toLocaleDateString()} textSize={12} textColor="#777" />
                  </View>
                </View>
              ))}

              {reseñas.length > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => setMostrarTodasResenas(!mostrarTodasResenas)}
                >
                  <TextComponent
                    text={mostrarTodasResenas ? "Ver menos" : `Ver más (${reseñas.length - 3} más)`}
                    textColor="#1E90FF"
                    fontWeight="bold"
                    textSize={14}
                  />
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      ) : (
        <TextComponent text="No se encontró el objeto." textColor="red" textSize={16} />
      )}

    </View>
  );
};

export default DetalleProducto;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: "#f7f7f7",
  },
  header: {
    marginBottom: 15,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Distribuir espacio
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  favButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  carouselContainer: {
    position: "relative",
    marginBottom: 10,
  },
  objetoImage: {
    height: 260,
    borderRadius: 12,
    resizeMode: "cover",
  },
  carouselControls: {
    position: "absolute",
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  caracteristicasCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  caracteristicaItem: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  alquilarButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alquilarButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.9,
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapBox: {
    width: "100%",
    height: 250,
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#e5e7eb",
  },
  reviewCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 5,
  },
  pageIndicator: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});