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

const MISSION_NAMES = {
  FIRST_REVIEW: "primera_resena",
  FIRST_RENTAL: "primer_alquiler",
} as const;

const Confetti = () => {
  const confettiPieces = useRef(
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
    }))
  ).current;

  useEffect(() => {
    confettiPieces.forEach((piece) => {
      piece.translateX.setValue(0);
      piece.translateY.setValue(0);
      piece.rotation.setValue(0);
      piece.opacity.setValue(0);
      piece.scale.setValue(0.3);

      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 400;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      Animated.parallel([
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
        Animated.timing(piece.opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(piece.scale, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 1,
          duration: 800 + Math.random() * 600,
          useNativeDriver: true,
        }),
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
        zIndex: 9998,
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
  const loadUserMissions = async (userId: string) => {
    try {
      // Obtener estado de misiones guardadas
      const { data: userMissions, error: missionsError } = await supabase
        .from("misiones")
        .select("*")
        .eq("usuario_id", userId);

      if (missionsError) {
        console.error("Error cargando misiones del usuario:", missionsError);
        setMissions(getDefaultMissions());
        return;
      }

      // Mapa de estados usando mision_name
      const missionStatusMap = new Map();
      userMissions?.forEach((mission) =>
        missionStatusMap.set(mission.mision_name, mission.estado)
      );

      // Verificar primera reseña
      const { data: reviews, error: reviewsError } = await supabase
        .from("resenia")
        .select("id")
        .eq("id_usuario", userId)
        .limit(1);

      if (reviewsError) {
        console.error("Error consultando reseñas:", reviewsError);
      }

      // Verificar primer alquiler
      const { data: rentals, error: rentalsError } = await supabase
        .from("alquileres")
        .select("id")
        .eq("usuario_id", userId)
        .limit(1);

      if (rentalsError) {
        console.error("Error consultando alquileres:", rentalsError);
      }

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

      // Insertar misiones completadas si no existen en DB
      for (const mission of missionsToProcess) {
        const currentStatus = missionStatusMap.get(mission.name);

        // Si com
