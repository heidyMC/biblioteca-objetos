import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AdminNotificationListener() {
  const isAdminRef = useRef(false);

  useEffect(() => {
    checkAdmin();
    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alquileres', filter: 'estado=eq.pendiente_devolucion' }, 
      (payload: any) => {
        if (isAdminRef.current) {
          Alert.alert(
            "🔔 Solicitud de Devolución", 
            `Código: ${payload.new.codigo_devolucion}\n\nPor favor, dicta este código al usuario.`
          );
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkAdmin = async () => {
    const u = await AsyncStorage.getItem("usuario");
    if (u) isAdminRef.current = JSON.parse(u).is_admin;
  };

  return null;
}