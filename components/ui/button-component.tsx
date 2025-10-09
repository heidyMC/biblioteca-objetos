import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";

type ButtonComponentProps = {
  label: string;
};

const ButtonComponent = (props : ButtonComponentProps) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => alert("Button Pressed!")}
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
