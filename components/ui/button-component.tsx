import React from "react";
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity } from "react-native";

type ButtonComponentProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void; // Permite pasar una función personalizada
};

const ButtonComponent = (props: ButtonComponentProps) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={props.onPress} // Usa la función pasada por props
    >
      <Text>{props.label}</Text>
    </TouchableOpacity>
  );
};

export default ButtonComponent;

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});