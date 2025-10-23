// TextComponent.tsx
import React from 'react';
import { Text, TextStyle } from 'react-native';

interface TextComponentProps {
  text: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  fontSize?: number; // ✅ agregamos fontSize aquí
  style?: TextStyle; // permite estilos adicionales
}

const TextComponent: React.FC<TextComponentProps> = ({
  text,
  fontWeight = 'normal',
  color = '#000',
  fontSize = 14,
  style,
}) => {
  return (
    <Text style={[{ fontWeight, color, fontSize }, style]}>
      {text}
    </Text>
  );
};

export default TextComponent;
