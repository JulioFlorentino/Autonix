# Autonix

Autonix is a cross-platform mobile application built with React Native and Expo. It allows users to manage their vehicles, follow automotive news, browse a parts catalog, watch videos, and participate in a community forum — all from a single, unified interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Scripts](#scripts)

---

## Features

- **Authentication** — Registration with activation code, login, and password recovery.
- **Vehicle Management** — Register, view, edit, and upload photos for personal vehicles.
- **News** — Browse automotive news articles with full detail view.
- **Videos** — Access a curated library of automotive videos.
- **Catalog** — Explore a parts and products catalog with detail pages.
- **Forum** — Create topics, view threads, and post replies in a community forum.
- **Profile** — View and update profile information including avatar photo.

---

## Tech Stack

| Layer          | Technology                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| Framework      | [Expo](https://expo.dev) ~54 / [React Native](https://reactnative.dev) 0.81 |
| Navigation     | [Expo Router](https://expo.github.io/router) (file-based routing)           |
| State / Auth   | React Context + AsyncStorage                                                |
| Animations     | React Native Reanimated 4                                                   |
| Icons          | Expo Vector Icons / Expo Symbols                                            |
| Image Handling | Expo Image + Expo Image Picker                                              |
| Language       | TypeScript                                                                  |

---

## Project Structure

```
app/
  _layout.tsx             Root layout with AuthProvider and theme setup
  login.tsx               Login screen
  register.tsx            Registration and activation screen
  acerca-de.tsx           About screen
  noticias-detalle.tsx    News article detail screen
  (tabs)/
    _layout.tsx           Tab bar layout (auth-guarded)
    index.tsx             Home screen with quick-access modules
    explore.tsx           News feed
    videos.tsx            Video library
    settings.tsx          Profile and settings
    catalogo/             Parts catalog
    foro/                 Community forum
    vehiculos/            Vehicle management

components/               Shared UI components (ThemedText, ThemedView, etc.)
constants/
  theme.ts                Color palette and design tokens
hooks/                    Custom hooks (useColorScheme, useThemeColor)
providers/
  auth-provider.tsx       Authentication context and session management
services/
  api-client.ts           Typed API client with all endpoint definitions
```

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

3. Start the development server:

   ```bash
   npx expo start
   ```

   From the terminal output, open the app in an Android emulator, iOS simulator, or on a physical device via [Expo Go](https://expo.dev/go).

---

## Environment Variables

Create a `.env` file at the project root. The only required variable is the API base URL. All endpoint paths have sensible defaults and can be overridden individually.

```env
# Required
EXPO_PUBLIC_API_BASE_URL=https://your-api.com/api

# Optional — override individual endpoint paths (defaults shown)
EXPO_PUBLIC_AUTH_LOGIN_ENDPOINT=/auth/login
EXPO_PUBLIC_AUTH_REGISTRO_ENDPOINT=/auth/registro
EXPO_PUBLIC_AUTH_ACTIVAR_ENDPOINT=/auth/activar
EXPO_PUBLIC_AUTH_OLVIDAR_ENDPOINT=/auth/olvidar
EXPO_PUBLIC_AUTH_REFRESH_ENDPOINT=/auth/refresh
EXPO_PUBLIC_PROFILE_ENDPOINT=/perfil
EXPO_PUBLIC_PROFILE_PHOTO_ENDPOINT=/perfil/foto
EXPO_PUBLIC_VEHICULOS_ENDPOINT=/vehiculos
EXPO_PUBLIC_VEHICULOS_DETALLE_ENDPOINT=/vehiculos/detalle
EXPO_PUBLIC_VEHICULOS_EDITAR_ENDPOINT=/vehiculos/editar
EXPO_PUBLIC_VEHICULOS_FOTO_ENDPOINT=/vehiculos/foto
EXPO_PUBLIC_FORO_CREAR_ENDPOINT=/foro/crear
EXPO_PUBLIC_FORO_TEMAS_ENDPOINT=/foro/temas
EXPO_PUBLIC_FORO_DETALLE_ENDPOINT=/foro/detalle
EXPO_PUBLIC_FORO_RESPONDER_ENDPOINT=/foro/responder
EXPO_PUBLIC_FORO_MIS_TEMAS_ENDPOINT=/foro/mis-temas
EXPO_PUBLIC_NOTICIAS_ENDPOINT=/noticias
EXPO_PUBLIC_NOTICIAS_DETALLE_ENDPOINT=/noticias/detalle
EXPO_PUBLIC_VIDEOS_ENDPOINT=/videos
EXPO_PUBLIC_CATALOGO_ENDPOINT=/catalogo
EXPO_PUBLIC_CATALOGO_DETALLE_ENDPOINT=/catalogo/detalle
```

---

## API Integration

All HTTP requests go through `services/api-client.ts`, which exposes typed helpers:

| Helper                                       | Purpose                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `getJson(endpoint, options)`                 | Authenticated GET request, returns unwrapped `data`                                                |
| `postDatax(endpoint, payload, options)`      | POST with body serialized as `application/x-www-form-urlencoded`, JSON placed in the `datax` field |
| `postMultipart(endpoint, formData, options)` | POST for file uploads (`multipart/form-data`)                                                      |

All POST requests that send structured data encode the JSON payload inside a `datax` field as `application/x-www-form-urlencoded`. Authenticated requests attach a `Bearer` token via the `Authorization` header.

---

## Authentication

Session management is handled by `AuthProvider` (`providers/auth-provider.tsx`). The session is persisted in AsyncStorage under the key `autonix_auth_session`.

| Method                                           | Description                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `login(matricula, contrasena)`                   | Authenticates the user and stores the session                      |
| `register(matricula)`                            | Initiates registration and returns a temporary token               |
| `activate(tokenTemporal, contrasena, matricula)` | Activates the account and starts a session                         |
| `forgotPassword(matricula)`                      | Sends a password recovery request                                  |
| `refreshAuthToken()`                             | Silently refreshes the access token using the stored refresh token |
| `updateSessionUser(patch)`                       | Partially updates the cached user profile                          |
| `logout()`                                       | Clears the session from memory and storage                         |

The tab layout redirects unauthenticated users to `/login` automatically.

---

## Scripts

| Command                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `npm start`             | Start the Expo development server                          |
| `npm run android`       | Start on Android emulator                                  |
| `npm run ios`           | Start on iOS simulator                                     |
| `npm run web`           | Start in a web browser                                     |
| `npm run lint`          | Run ESLint across the project                              |
| `npm run reset-project` | Archive starter code and reset to a blank `app/` directory |
