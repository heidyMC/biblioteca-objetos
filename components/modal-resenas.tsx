import TextComponent from "@/components/ui/text-component";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SuccessModal from "./SuccessModal"; // Importamos el componente de animación

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function ModalResenas({ visible, onClose, userId, onSuccess }: Props) {
  // Estados
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [objetoSeleccionado, setObjetoSeleccionado] = useState<any | null>(null);
  const [reseñasAnteriores, setReseñasAnteriores] = useState<any[]>([]);
  const [loadingReseñas, setLoadingReseñas] = useState(false);

  // Formulario
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado para el modal de éxito (Celebración)
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);

  // Cargar lista al abrir
  useEffect(() => {
    if (visible && userId) {
      cargarAlquileresPendientes();
      // Resetear formulario
      setObjetoSeleccionado(null);
      setCalificacion(0);
      setComentario("");
    }
  }, [visible, userId]);

  // Cargar reseñas al seleccionar objeto
  useEffect(() => {
    if (objetoSeleccionado) {
      cargarReseñasDelObjeto(objetoSeleccionado.id);
    }
  }, [objetoSeleccionado]);

  const cargarAlquileresPendientes = async () => {
    setLoading(true);
    
    try {
      // 1. Obtener tus alquileres completados
      const { data: alquileres, error: errorAlquileres } = await supabase
        .from("alquileres")
        .select(`
          id,
          objetos (
            id,
            nombre,
            imagen_url
          )
        `)
        .eq("usuario_id", userId)
        .eq("estado", "completado");

      if (errorAlquileres) throw errorAlquileres;

      // 2. Obtener los IDs de objetos que YA has reseñado
      const { data: misReseñas, error: errorReseñas } = await supabase
        .from("resenia")
        .select("id_objeto")
        .eq("id_usuario", userId);

      if (errorReseñas) throw errorReseñas;

      // Creamos un Set (conjunto) con los IDs reseñados para buscar rápido
      const idsReseñados = new Set(misReseñas?.map(r => r.id_objeto));

      if (alquileres) {
        // 3. FILTRO MÁGICO:
        // Solo dejamos pasar los alquileres cuyo objeto NO esté en la lista de reseñados
        const filtrados = alquileres.filter((item: any) => !idsReseñados.has(item.objetos.id));

        // Formateamos la lista
        const listaFormateada = filtrados.map((item: any) => ({
          id: item.objetos.id,      // ID del objeto
          nombre: item.objetos.nombre,
          imagen: item.objetos.imagen_url,
          alquiler_id: item.id
        }));

        // 4. Eliminar duplicados visuales 
        // (Si alquilaste 3 veces el mismo taladro y no lo has reseñado, que solo salga 1 vez en la lista)
        const unicos = Array.from(new Map(listaFormateada.map(item => [item.id, item])).values());

        setPendientes(unicos);
      }
    } catch (error) {
      console.error("Error cargando pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReseñasDelObjeto = async (objetoId: string) => {
    setLoadingReseñas(true);
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
      .eq("id_objeto", objetoId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setReseñasAnteriores(data);
    }
    setLoadingReseñas(false);
  };

  const enviarResena = async () => {
    if (!calificacion || !comentario.trim()) {
      Alert.alert("Faltan datos", "Por favor califica con estrellas y escribe un comentario.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insertar la reseña
      const { error } = await supabase.from("resenia").insert({
        id_usuario: userId,
        id_objeto: objetoSeleccionado.id,
        calificacion: calificacion,
        comentario: comentario,
      });

      if (error) throw error;

      // 2. Dar recompensa (5 tokens)
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("tokens_disponibles")
        .eq("id", userId)
        .single();

      const nuevosTokens = (usuario?.tokens_disponibles || 0) + 5;

      await supabase
        .from("usuarios")
        .update({ tokens_disponibles: nuevosTokens })
        .eq("id", userId);

      // CAMBIO: En lugar de Alert, mostramos el SuccessModal con animación
      setSuccessPoints(5);
      setShowSuccess(true);

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Función que se ejecuta al cerrar el modal de éxito
  const handleCloseSuccess = () => {
    setShowSuccess(false);
    cargarAlquileresPendientes(); // Refrescar lista para quitar el objeto reseñado
    onSuccess(); // Actualizar tokens en pantalla padre
    
    // Resetear formulario
    setObjetoSeleccionado(null);
    setCalificacion(0);
    setComentario("");
  };

  const renderStars = (valor: number, interactivo: boolean = false) => {
    return (
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactivo}
            onPress={() => interactivo && setCalificacion(star)}
          >
            <Ionicons
              name={star <= valor ? "star" : "star-outline"}
              size={interactivo ? 32 : 16}
              color="#F59E0B"
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <TextComponent text={objetoSeleccionado ? "Escribir Reseña" : "Objetos por Reseñar"} fontWeight="bold" textSize={18} />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
          ) : (
            <>
              {/* VISTA 1: LISTA DE OBJETOS */}
              {!objetoSeleccionado ? (
                <FlatList
                  data={pendientes}
                  keyExtractor={(item) => item.id} 
                  ListEmptyComponent={
                    <View style={{alignItems:'center', marginTop:40}}>
                        <Ionicons name="checkmark-circle-outline" size={50} color="#10B981" />
                        <TextComponent text="¡Todo al día! No tienes reseñas pendientes." textSize={14} textColor="#666" style={{textAlign:'center', marginTop:10}} />
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemLista}
                      onPress={() => setObjetoSeleccionado(item)}
                    >
                      <Image 
                        source={{ uri: item.imagen || "https://via.placeholder.com/50" }} 
                        style={styles.imgObjeto} 
                      />
                      <View style={{flex: 1, marginLeft: 12}}>
                        <TextComponent text={item.nombre} fontWeight="600" />
                        <TextComponent text="Toca para calificar" textSize={12} textColor="#6366F1" />
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                /* VISTA 2: DETALLE Y FORMULARIO */
                <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity 
                    style={styles.backLink} 
                    onPress={() => setObjetoSeleccionado(null)}
                  >
                    <Ionicons name="arrow-back" size={16} color="#6366F1" />
                    <TextComponent text="Volver a la lista" textSize={14} textColor="#6366F1" />
                  </TouchableOpacity>

                  {/* Info Objeto */}
                  <View style={styles.infoObjeto}>
                    <Image source={{ uri: objetoSeleccionado.imagen }} style={styles.imgGrande} />
                    <TextComponent text={objetoSeleccionado.nombre} fontWeight="bold" textSize={20} style={{marginTop:10}} />
                  </View>

                  {/* === SECCIÓN 1: TU RESEÑA (FORMULARIO) === */}
                  <TextComponent text="Tu calificación:" fontWeight="bold" style={{marginTop:10}} />
                  <View style={{alignItems:'center', marginVertical:10}}>
                    {renderStars(calificacion, true)}
                  </View>

                  <TextComponent text="Tu comentario:" fontWeight="bold" />
                  <TextInput
                    style={styles.input}
                    placeholder="¿Qué te pareció el objeto? ¿Funcionó bien?"
                    multiline
                    value={comentario}
                    onChangeText={setComentario}
                  />

                  <TouchableOpacity
                    style={[styles.btnEnviar, submitting && { opacity: 0.7 }]}
                    onPress={enviarResena}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <TextComponent text="Publicar Reseña" textColor="#FFF" fontWeight="bold" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* === SECCIÓN 2: OPINIONES ANTERIORES === */}
                  <View style={styles.seccionReseñas}>
                    <TextComponent text="Opiniones anteriores:" fontWeight="600" textSize={14} style={{marginBottom:10}} />
                    
                    {loadingReseñas ? (
                      <ActivityIndicator color="#6366F1" />
                    ) : reseñasAnteriores.length === 0 ? (
                      <TextComponent text="Aún no hay opiniones. ¡Sé el primero!" textSize={13} textColor="#999" style={{fontStyle:'italic'}} />
                    ) : (
                      reseñasAnteriores.map((res) => (
                        <View key={res.id} style={styles.cardReseña}>
                          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                            <TextComponent text={res.usuarios?.nombre || "Anónimo"} fontWeight="bold" textSize={13} />
                            {renderStars(res.calificacion)}
                          </View>
                          <TextComponent text={res.comentario} textSize={13} textColor="#444" style={{marginTop:4}} />
                        </View>
                      ))
                    )}
                  </View>

                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>

      {/* Modal de Éxito con Confeti */}
      {showSuccess && (
        <SuccessModal 
          visible={showSuccess}
          title="¡Reseña Publicada!"
          message="Gracias por compartir tu opinión."
          points={successPoints}
          onClose={handleCloseSuccess}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    height: "85%", 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  itemLista: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  imgObjeto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 5,
  },
  infoObjeto: {
    alignItems: "center",
    marginBottom: 20,
  },
  imgGrande: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  seccionReseñas: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginTop: 10, 
    marginBottom: 20,
  },
  cardReseña: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20, 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    height: 100,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  btnEnviar: {
    backgroundColor: "#6366F1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});