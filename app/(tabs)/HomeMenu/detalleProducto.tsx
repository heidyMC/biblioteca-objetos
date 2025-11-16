"use client";

import TextComponent from "@/components/ui/text-component";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

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

const DetalleProducto = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [objeto, setObjeto] = useState<Producto | null>(null);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaObjeto[]>([]);
  const [reseñas, setReseñas] = useState<Resenia[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const productoId = searchParams.id as string | undefined;

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
      } else {
        console.error("Error fetch objeto:", errorObjeto);
      }

      await fetchReseñas();
      setLoading(false);
    };

    fetchData();
  }, [productoId]);

  const publicarReseña = async () => {
    if (!usuario || !objeto) return;
    if (!comentario.trim() || calificacion === 0) {
      Alert.alert("Error", "Por favor, completa la reseña y selecciona una calificación.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("resenia").insert({
      id_usuario: usuario.id,
      id_objeto: objeto.id,
      comentario,
      calificacion,
    });

    if (error) {
      Alert.alert("Error", "No se pudo guardar la reseña.");
      console.error(error.message);
    } else {
      setComentario("");
      setCalificacion(0);
      await fetchReseñas();
    }

    setSubmitting(false);
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/Perfil/PerfilUsuario")}>
            <Image
              source={{
                uri: usuario?.foto_url || "https://placehold.co/100x100?text=Sin+Foto",
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View>
            <TextComponent text={usuario?.nombre || "Cargando..."} fontWeight="bold" textSize={16} />
            <TextComponent text={`💰 ${usuario?.tokens_disponibles ?? 0} tokens`} textSize={13} textColor="#555" />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : objeto ? (
        <ScrollView>
          {/* Datos del objeto */}
          <Image source={{ uri: objeto.imagen_url || "https://placehold.co/300x200" }} style={styles.objetoImage} />

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

          {/* Mapa */}
          {objeto.latitud && objeto.longitud && (
            <View style={styles.mapContainer}>
              <TextComponent text="📍 Ubicación del Producto" fontWeight="bold" textSize={18} textColor="#1E293B" />
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: objeto.latitud,
                  longitude: objeto.longitud,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: objeto.latitud, longitude: objeto.longitud }} title={objeto.nombre} />
              </MapView>
            </View>
          )}
          <TouchableOpacity
            style={[styles.alquilarButton, !canRent && styles.alquilarButtonDisabled]}
            onPress={() => {
              if (!canRent) return; // seguro extra
              router.push({
                pathname: '/(tabs)/rental-screen',
                params: { producto: JSON.stringify(objeto) },
              });
            }}
            activeOpacity={canRent ? 0.8 : 1}
            disabled={!canRent}
            accessibilityState={{ disabled: !canRent }}
            accessibilityLabel={canRent ? "Alquilar objeto" : "Objeto no disponible"}
          >
            <TextComponent text={canRent ? "🔑 Alquilar" : "⛔ No disponible"} fontWeight="bold" textSize={18} textColor="#fff" />
          </TouchableOpacity>

          {/* Reseñas */}
          <TextComponent text="★ Reseñas" fontWeight="bold" textSize={20} textColor="#1E293B" style={{ marginTop: 20 }} />
          {reseñas.length === 0 ? (
            <TextComponent text="Aún no hay reseñas." textSize={14} textColor="#6B7280" />
          ) : (
            reseñas.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Image source={{ uri: r.usuarios?.foto_url || "https://placehold.co/60x60" }} style={styles.reviewerPhoto} />
                <View style={{ flex: 1 }}>
                  <TextComponent text={r.usuarios?.nombre || "Usuario"} fontWeight="bold" textSize={15} />
                  {renderStars(r.calificacion)}
                  <TextComponent text={r.comentario} textSize={14} textColor="#333" />
                  <TextComponent text={new Date(r.created_at).toLocaleDateString()} textSize={12} textColor="#777" />
                </View>
              </View>
            ))
          )}

          {/* Formulario reseña */}
          <View style={styles.addReviewContainer}>
            <TextComponent text="Agregar reseña" fontWeight="bold" textSize={18} textColor="#1E293B" />
            <View style={{ flexDirection: "row", marginVertical: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setCalificacion(star)}>
                  <TextComponent text={star <= calificacion ? "★" : "☆"} textColor={star <= calificacion ? "#FFD700" : "#D3D3D3"} textSize={24} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Escribe tu comentario..." multiline value={comentario} onChangeText={setComentario} />
            <TouchableOpacity style={styles.publishButton} onPress={publicarReseña} disabled={submitting}>
              <TextComponent text={submitting ? "Publicando..." : "Publicar"} fontWeight="bold" textColor="#fff" />
            </TouchableOpacity>
          </View>
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
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  objetoImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
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
  // estilo aplicado cuando NO se puede alquilar
  alquilarButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.9,
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  map: {
    width: "100%",
    height: 200,
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
  addReviewContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  publishButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
});
