import { StyleSheet, Text, TextStyle } from 'react-native';
import React from 'react';

type TextComponentProps = {
  text: string;
  textColor?: string;
  textSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style?: TextStyle; // <- agregamos la prop style opcional
};

const TextComponent = ({
  text,
  textColor = '#333',
  textSize = 20,
  fontWeight = 'normal',
  style,
}: TextComponentProps) => {
  return (
    <Text style={[{ color: textColor, fontSize: textSize, fontWeight }, style]}>
      {text}
    </Text>
  );
};


export default TextComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontWeight: 'bold',
  },
});
