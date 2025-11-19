import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { RootStackParamList } from "../types/navigation";
import { styles } from "./CompleteMissionsScreen.styles";

const { width, height } = Dimensions.get("window");

type MissionStatus = "pending" | "completed" | "claimed";

type Mission = {
  id: string;
  title: string;
  description: string;
  type: "review" | "rental";
  status: MissionStatus;
  reward: number;
  actionRequired: boolean;
};

type User = {
  id: string;
  nombre: string;
  tokens_disponibles: number;
  correo: string;
  telefono?: string;
  foto_url?: string;
  referal_code?: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Constantes para los nombres de misiones
const MISSION_NAMES = {
  FIRST_REVIEW: "primera_resena",
  FIRST_RENTAL: "primer_alquiler",
} as const;

const Confetti = () => {
  const confettiPieces = useRef(
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      // Posiciones iniciales desde el centro
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    }))
  ).current;

  useEffect(() => {
    confettiPieces.forEach((piece) => {
      // Reset values - todas comienzan desde el centro invisible
      piece.translateX.setValue(0);
      piece.translateY.setValue(0);
      piece.rotation.setValue(0);
      piece.opacity.setValue(0);
      piece.scale.setValue(0.3);

      // Destino: explosión radial desde el centro
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 400;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      // Animación de explosión rápida
      Animated.parallel([
        // Movimiento explosivo (400-700ms)
        Animated.timing(piece.translateX, {
          toValue: targetX,
          duration: 400 + Math.random() * 300,
          useNativeDriver: true,
        }),
        Animated.timing(piece.translateY, {
          toValue: targetY,
          duration: 400 + Math.random() * 300,
          useNativeDriver: true,
        }),
        // Aparece inmediatamente
        Animated.timing(piece.opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Escala
        Animated.spring(piece.scale, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        // Rotación
        Animated.timing(piece.rotation, {
          toValue: 1,
          duration: 800 + Math.random() * 600,
          useNativeDriver: true,
        }),
        // Fade out después de 2 segundos
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9998, // DETRÁS del modal pero ENCIMA del overlay
      }}
    >
      {confettiPieces.map((piece) => {
        const rotate = piece.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "720deg"],
        });

        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFA07A",
          "#98D8C8",
          "#F7DC6F",
          "#BB8FCE",
          "#85C1E9",
          "#FFD700",
          "#FF69B4",
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const shapes = ["circle", "square", "rectangle"];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        const getShapeStyle = () => {
          switch (shape) {
            case "circle":
              return { borderRadius: 6, width: 12, height: 12 };
            case "square":
              return { borderRadius: 2, width: 10, height: 10 };
            case "rectangle":
              return { borderRadius: 1, width: 8, height: 14 };
            default:
              return { borderRadius: 4, width: 10, height: 10 };
          }
        };

        return (
          <Animated.View
            key={piece.id}
            style={{
              position: "absolute",
              left: width / 2,
              top: height / 2,
              transform: [
                { translateX: piece.translateX },
                { translateY: piece.translateY },
                { rotate },
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
              backgroundColor: color,
              ...getShapeStyle(),
            }}
          />
        );
      })}
    </View>
  );
};

const CompleteMissionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserAndMissions();
  }, []);

  const loadUserAndMissions = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        await loadUserMissions(user.id);
      } else {
        setMissions(getDefaultMissions());
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
      setMissions(getDefaultMissions());
    } finally {
      setLoading(false);
    }
  };

  const loadUserMissions = async (userId: string) => {
    try {
      // Cargar estado de misiones desde Supabase
      const { data: userMissions, error: missionsError } = await supabase
        .from("misiones")
        .select("*")
        .eq("usuario_id", userId);

      if (missionsError) {
        console.error("Error cargando misiones del usuario:", missionsError);
        setMissions(getDefaultMissions());
        return;
      }

      // Crear mapa de estado de misiones usando mision_name
      const missionStatusMap = new Map();
      userMissions?.forEach((mission) => {
        missionStatusMap.set(mission.mision_name, mission.estado);
      });

      // Verificar si ya hizo reseñas
      const { data: reviews, error: reviewsError } = await supabase
        .from("resenia")
        .select("id")
        .eq("id_usuario", userId)
        .limit(1);

      if (reviewsError) {
        console.error("Error consultando reseñas:", reviewsError);
      }

      // Verificar si ya hizo alquileres
      const { data: rentals, error: rentalsError } = await supabase
        .from("alquileres")
        .select("id")
        .eq("usuario_id", userId)
        .limit(1);

      if (rentalsError) {
        console.error("Error consultando alquileres:", rentalsError);
      }

      // Para cada misión, verificar si está completada en la base de datos
      const missionsToProcess = [
        {
          name: MISSION_NAMES.FIRST_REVIEW,
          type: "review" as const,
          completed: reviews && reviews.length > 0,
        },
        {
          name: MISSION_NAMES.FIRST_RENTAL,
          type: "rental" as const,
          completed: rentals && rentals.length > 0,
        },
      ];

      for (const mission of missionsToProcess) {
        const currentStatus = missionStatusMap.get(mission.name);

        // Si la misión está completada pero no está en misiones, insertarla
        if (mission.completed && !currentStatus) {
          const { error: insertError } = await supabase
            .from("misiones")
            .insert([
              {
                usuario_id: userId,
                mision_name: mission.name,
                estado: "completada",
              },
            ]);

          if (insertError) {
            console.error(
              `Error insertando misión ${mission.name}:`,
              insertError
            );
          } else {
            missionStatusMap.set(mission.name, "completada");
          }
        }
      }

      const userMissionsData: Mission[] = [
        {
          id: MISSION_NAMES.FIRST_REVIEW,
          title: "Primera Reseña",
          description: "Escribe tu primera reseña de un objeto alquilado",
          type: "review",
          status:
            missionStatusMap.get(MISSION_NAMES.FIRST_REVIEW) === "reclamada"
              ? "claimed"
              : missionStatusMap.get(MISSION_NAMES.FIRST_REVIEW) ===
                "completada"
              ? "completed"
              : "pending",
          reward: 10,
          actionRequired: true,
        },
        {
          id: MISSION_NAMES.FIRST_RENTAL,
          title: "Primer Alquiler",
          description: "Realiza tu primer alquiler de objeto",
          type: "rental",
          status:
            missionStatusMap.get(MISSION_NAMES.FIRST_RENTAL) === "reclamada"
              ? "claimed"
              : missionStatusMap.get(MISSION_NAMES.FIRST_RENTAL) ===
                "completada"
              ? "completed"
              : "pending",
          reward: 10,
          actionRequired: true,
        },
      ];

      setMissions(userMissionsData);
    } catch (error) {
      console.error("Error cargando misiones:", error);
      setMissions(getDefaultMissions());
    }
  };

  const getDefaultMissions = (): Mission[] => {
    return [
      {
        id: MISSION_NAMES.FIRST_REVIEW,
        title: "Primera Reseña",
        description: "Escribe tu primera reseña de un objeto alquilado",
        type: "review",
        status: "pending",
        reward: 10,
        actionRequired: true,
      },
      {
        id: MISSION_NAMES.FIRST_RENTAL,
        title: "Primer Alquiler",
        description: "Realiza tu primer alquiler de objeto",
        type: "rental",
        status: "pending",
        reward: 10,
        actionRequired: true,
      },
    ];
  };

  const handleMissionPress = async (mission: Mission) => {
    if (mission.status === "claimed") return;

    if (mission.status === "completed") {
      setSelectedMission(mission);
      setShowCelebration(true);
      startCelebrationAnimation();
      return;
    }

    switch (mission.type) {
      case "review":
        navigation.navigate("(tabs)" as any);
        break;
      case "rental":
        navigation.navigate("(tabs)" as any);
        break;
      default:
        Alert.alert("Acción no disponible");
    }
  };

  const startCelebrationAnimation = () => {
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const claimReward = async (mission: Mission) => {
    if (isClaiming) return;

    setIsClaiming(true);
    try {
      if (!user) {
        Alert.alert("Error", "Usuario no encontrado");
        setIsClaiming(false);
        return;
      }

      // Sumar tokens al usuario en Supabase
      const newTokens = (user.tokens_disponibles || 0) + mission.reward;

      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ tokens_disponibles: newTokens })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error actualizando tokens:", updateError);
        Alert.alert("Error", "No se pudo actualizar los tokens");
        setIsClaiming(false);
        return;
      }

      // Actualizar usuario en AsyncStorage
      const updatedUser = { ...user, tokens_disponibles: newTokens };
      await AsyncStorage.setItem("usuario", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Actualizar la misión a 'reclamada' en la tabla misiones
      const { error: updateMissionError } = await supabase
        .from("misiones")
        .update({
          estado: "reclamada",
        })
        .eq("usuario_id", user.id)
        .eq("mision_name", mission.id);

      if (updateMissionError) {
        console.error(
          "Error actualizando misión a reclamada:",
          updateMissionError
        );

        // Si no existe el registro, crearlo
        const { error: insertError } = await supabase.from("misiones").insert([
          {
            usuario_id: user.id,
            mision_name: mission.id,
            estado: "reclamada",
          },
        ]);

        if (insertError) {
          console.error("Error insertando misión reclamada:", insertError);
          Alert.alert("Error", "No se pudo registrar la misión como reclamada");
          setIsClaiming(false);
          return;
        }
      }

      // Actualizar estado de la misión a reclamada
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? { ...m, status: "claimed" } : m))
      );
      // MOSTRAR CONFETI Y ESPERAR A QUE TERMINE LA ANIMACIÓN
      setShowConfetti(true);

      // Cerrar todo después de 3 segundos (duración del confeti)
      setTimeout(() => {
        setShowConfetti(false);
        setShowCelebration(false);
        setSelectedMission(null);
        setIsClaiming(false);
      }, 3000);
    } catch (error) {
      console.error("Error reclamando recompensa:", error);
      Alert.alert("Error", "No se pudo reclamar la recompensa");
      setIsClaiming(false);
    }
  };

  const closeModal = () => {
    if (!isClaiming) {
      setShowCelebration(false);
      setSelectedMission(null);
    }
  };

  const getMissionIcon = (type: Mission["type"]) => {
    switch (type) {
      case "review":
        return "⭐";
      case "rental":
        return "🔄";
      default:
        return "🎯";
    }
  };

  const getStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case "pending":
        return (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Por Completar</Text>
          </View>
        );
      case "completed":
        return (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completada</Text>
          </View>
        );
      case "claimed":
        return (
          <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>Reclamada</Text>
          </View>
        );
    }
  };

  const getCardStyle = (status: MissionStatus) => {
    switch (status) {
      case "pending":
        return styles.missionCard;
      case "completed":
        return styles.missionCardCompleted;
      case "claimed":
        return styles.missionCardClaimed;
    }
  };

  const renderSkeletonLoader = () => {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
          </TouchableOpacity>
          <Text style={styles.title}>Completar Misiones</Text>
          <Text style={styles.subtitle}>
            Completa estas acciones para ganar tokens
          </Text>
        </View>

        <ScrollView
          style={styles.missionsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2].map((item) => (
            <View key={item} style={styles.skeletonMissionCard}>
              <View style={styles.skeletonMissionHeader}>
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonMissionInfo}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonDescription} />
                </View>
                <View style={styles.skeletonRewardContainer}>
                  <View style={styles.skeletonRewardText} />
                  <View style={styles.skeletonRewardLabel} />
                </View>
              </View>
              <View style={styles.skeletonMissionFooter}>
                <View style={styles.skeletonBadge} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  };

  if (loading) {
    return renderSkeletonLoader();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.title}>Completar Misiones</Text>
        <Text style={styles.subtitle}>
          Completa estas acciones para ganar tokens
        </Text>
      </View>

      <ScrollView
        style={styles.missionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {missions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay misiones disponibles
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadUserAndMissions}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          missions.map((mission) => (
            <TouchableOpacity
              key={mission.id}
              style={getCardStyle(mission.status)}
              onPress={() => handleMissionPress(mission)}
              disabled={mission.status === "claimed"}
            >
              <View style={styles.missionHeader}>
                <Text style={styles.missionIcon}>
                  {getMissionIcon(mission.type)}
                </Text>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionDescription}>
                    {mission.description}
                  </Text>
                </View>
                <View style={styles.rewardContainer}>
                  <Text style={styles.rewardText}>+{mission.reward}</Text>
                  <Text style={styles.rewardLabel}>Tokens</Text>
                </View>
              </View>

              <View style={styles.missionFooter}>
                {getStatusBadge(mission.status)}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showCelebration}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          {/* Confeti solo se muestra cuando showConfetti es true */}
          {showConfetti && <Confetti />}

          <View style={styles.modalContent}>
            <Animated.View
              style={[
                styles.celebrationModal,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.confetti}>🎉</Text>
              <Text style={styles.congratsTitle}>¡Felicidades!</Text>
              <Text style={styles.congratsText}>
                Has completado la misión:{"\n"}`{selectedMission?.title}`
              </Text>
              <Text style={styles.rewardTextModal}>
                +{selectedMission?.reward} Tokens
              </Text>
              <TouchableOpacity
                style={[
                  styles.claimButton,
                  (isClaiming || showConfetti) && styles.claimButtonDisabled,
                ]}
                onPress={() => selectedMission && claimReward(selectedMission)}
                disabled={isClaiming || showConfetti} // Deshabilitar durante confeti también
              >
                <Text
                  style={[
                    styles.claimButtonText,
                    (isClaiming || showConfetti) &&
                      styles.claimButtonTextDisabled,
                  ]}
                >
                  {isClaiming ? "Reclamando..." : "Reclamar Recompensa"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.closeButton,
                  (isClaiming || showConfetti) && styles.closeButtonDisabled,
                ]}
                onPress={closeModal}
                disabled={isClaiming || showConfetti}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    (isClaiming || showConfetti) &&
                      styles.closeButtonTextDisabled,
                  ]}
                >
                  Cerrar
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CompleteMissionsScreen;
