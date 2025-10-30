import { Slot } from 'expo-router';
import React from 'react';

// Root layout: renderiza las rutas hijas. El grupo de tabs está en `app/(tabs)/_layout.tsx`.
export default function RootLayout() {
  return <Slot />;
}