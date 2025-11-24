# 📦 PrestaFacil

> **Alquila lo que necesites, gana tokens y comparte con tu comunidad.**

**PrestaFacil** es una aplicación móvil desarrollada en React Native con Expo que facilita el alquiler de objetos (herramientas, consolas, cámaras, etc.) utilizando un sistema de economía interna basado en **Tokens**.

---

## 📱 Características Principales

* **Sistema de Tokens:** Los usuarios adquieren tokens mediante pagos QR y los utilizan para alquilar objetos por días.
* **Gamificación:**
    * **Misiones:** Gana tokens extra completando tareas (primera reseña, devoluciones a tiempo).
    * **Ranking:** Compite por ser el usuario con más tokens.
    * **Referidos:** Sistema de invitación con recompensas para ambos usuarios.
* **Roles de Usuario:**
    * **Usuario Estándar:** Puede alquilar, dejar reseñas, comprar tokens y ver su historial.
    * **Administrador:** Panel exclusivo para gestionar transacciones, aprobar solicitudes de alquiler y gestionar devoluciones mediante códigos de seguridad.
* **Autenticación:** Inicio de sesión seguro con Correo/Contraseña y **Google Sign-In**.
* **Geolocalización:** Visualización de la ubicación de los objetos (integración con mapas).

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** [React Native](https://reactnative.dev/) (v0.81) con [Expo](https://expo.dev/) (SDK 54).
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/).
* **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (Navegación basada en archivos).
* **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime).
* **Estilos:** React Native StyleSheet.
* **Componentes UI:** `react-native-safe-area-context`, `expo-image`, `react-native-community/datetimepicker`.

---

## 🚀 Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### 1. Prerrequisitos

* Tener instalado **Node.js** y **npm**.
* Tener configurado el entorno para desarrollo móvil (Android Studio / Xcode) o tener la app **Expo Go** en tu celular.

### 2. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/heidyMC/biblioteca-objetos.git
cd biblioteca-objetos
npm install
npm start