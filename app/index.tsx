import { Redirect } from 'expo-router';

// Redirigir a la página de inicio en el grupo (auth)
export default function Index() {
    return <Redirect href="/(auth)/HomePage" />;
}