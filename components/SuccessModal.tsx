import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// --- Lógica de Confeti (Extraída de CompleteMissionsScreen) ---
const Confetti = () => {
  const confettiPieces = useRef(
    Array.from({ length: 50 }, (_, i) => ({
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
      const distance = 100 + Math.random() * 300;
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
          Animated.delay(1500),
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {confettiPieces.map((piece) => {
        const rotate = piece.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "720deg"],
        });
        const colors = ["#FF6B6B", "#4ECDC4", "#FFD700", "#FF69B4", "#6366F1"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <Animated.View
            key={piece.id}
            style={{
              position: "absolute",
              left: width / 2,
              top: height / 2,
              width: 10,
              height: 10,
              backgroundColor: color,
              borderRadius: 5,
              transform: [
                { translateX: piece.translateX },
                { translateY: piece.translateY },
                { rotate },
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
            }}
          />
        );
      })}
    </View>
  );
};

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  points?: number;
  buttonText?: string;
  onClose: () => void;
}

export default function SuccessModal({
  visible,
  title,
  message,
  points,
  buttonText = "Continuar",
  onClose,
}: SuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        {visible && <Confetti />}
        <View style={styles.modalContent}>
          <Animated.View
            style={[
              styles.celebrationModal,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{message}</Text>
            
            {points ? (
              <Text style={styles.rewardText}>+{points} Tokens</Text>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo un poco más oscuro
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
    padding: 20,
  },
  celebrationModal: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    width: "100%",
    maxWidth: 340,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  rewardText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#10B981", // Verde esmeralda para tokens
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});