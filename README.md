# Autonix

Autonix es una aplicacion movil multiplataforma desarrollada con React Native y Expo. Permite a los usuarios gestionar sus vehiculos, consultar noticias automotrices, explorar un catalogo de productos, ver videos y participar en un foro comunitario, todo desde una interfaz unificada.

---

## Tabla de Contenidos

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Primeros Pasos](#primeros-pasos)
- [Variables de Entorno](#variables-de-entorno)
- [Integracion con la API](#integracion-con-la-api)
- [Autenticacion](#autenticacion)
- [Scripts Disponibles](#scripts-disponibles)

---

## Funcionalidades

- **Autenticacion** — Registro con codigo de activacion, inicio de sesion y recuperacion de contrasena.
- **Gestion de Vehiculos** — Registro, consulta, edicion y carga de fotos de vehiculos personales.
- **Noticias** — Listado de articulos automotrices con vista de detalle completa.
- **Videos** — Acceso a una biblioteca de videos curada.
- **Catalogo** — Exploracion de productos y repuestos con paginas de detalle.
- **Foro** — Creacion de temas, lectura de hilos y publicacion de respuestas en la comunidad.
- **Perfil** — Consulta y actualizacion de datos personales, incluida la foto de perfil.

---

## Tecnologias

| Capa              | Tecnologia                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| Framework         | [Expo](https://expo.dev) ~54 / [React Native](https://reactnative.dev) 0.81  |
| Navegacion        | [Expo Router](https://expo.github.io/router) (enrutamiento basado en archivos) |
| Estado / Auth     | React Context + AsyncStorage                                                 |
| Animaciones       | React Native Reanimated 4                                                    |
| Iconos            | Expo Vector Icons / Expo Symbols                                             |
| Manejo de Imagenes| Expo Image + Expo Image Picker                                               |
| Lenguaje          | TypeScript                                                                   |

---

## Estructura del Proyecto

```
app/
  _layout.tsx             Layout raiz con AuthProvider y configuracion de tema
  login.tsx               Pantalla de inicio de sesion
  register.tsx            Pantalla de registro y activacion de cuenta
  acerca-de.tsx           Pantalla "Acerca de"
  noticias-detalle.tsx    Detalle de articulo de noticias
  (tabs)/
    _layout.tsx           Layout del tab bar (protegido por autenticacion)
    index.tsx             Pantalla de inicio con accesos rapidos
    explore.tsx           Feed de noticias
    videos.tsx            Biblioteca de videos
    settings.tsx          Perfil y configuracion
    catalogo/             Modulo de catalogo
    foro/                 Modulo del foro comunitario
    vehiculos/            Modulo de gestion de vehiculos

components/               Componentes de UI reutilizables (ThemedText, ThemedView, etc.)
constants/
  theme.ts                Paleta de colores y tokens de diseno
hooks/                    Hooks personalizados (useColorScheme, useThemeColor)
providers/
  auth-provider.tsx       Contexto de autenticacion y gestion de sesion
services/
  api-client.ts           Cliente HTTP tipado con definicion de endpoints
```

---

## Primeros Pasos

**Requisitos previos:** Node.js 18+ y npm.

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un archivo `.env` en la raiz del proyecto (ver [Variables de Entorno](#variables-de-entorno)).

3. Iniciar el servidor de desarrollo:

   ```bash
   npx expo start
   ```

   Desde la salida del terminal, abrir la aplicacion en un emulador Android, simulador iOS o en un dispositivo fisico mediante [Expo Go](https://expo.dev/go).

---

## Variables de Entorno

Crear un archivo `.env` en la raiz del proyecto. La unica variable obligatoria es la URL base de la API. Los nombres de los endpoints tienen valores predeterminados y pueden sobrescribirse individualmente mediante variables de entorno con el prefijo `EXPO_PUBLIC_`.

```env
# Obligatoria
EXPO_PUBLIC_API_BASE_URL=https://tu-api.com/api
```

No incluir credenciales, tokens ni URLs internas en este archivo si el repositorio es publico. Utilizar un servicio de gestion de secretos para entornos de produccion.

---

## Integracion con la API

Todas las solicitudes HTTP pasan por `services/api-client.ts`, que expone helpers tipados:

| Helper                                       | Descripcion                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `getJson(endpoint, options)`                 | Solicitud GET autenticada; retorna el campo `data` del cuerpo de respuesta                               |
| `postDatax(endpoint, payload, options)`      | Solicitud POST con cuerpo codificado como `application/x-www-form-urlencoded`, JSON dentro del campo `datax` |
| `postMultipart(endpoint, formData, options)` | Solicitud POST para carga de archivos (`multipart/form-data`)                                            |

Las solicitudes autenticadas incluyen un token `Bearer` en el encabezado `Authorization`.

---

## Autenticacion

La sesion es gestionada por `AuthProvider` en `providers/auth-provider.tsx`. La sesion se persiste de forma local en el dispositivo mediante AsyncStorage.

| Metodo                                           | Descripcion                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `login(matricula, contrasena)`                   | Autentica al usuario y almacena la sesion                             |
| `register(matricula)`                            | Inicia el registro y retorna un token temporal                        |
| `activate(tokenTemporal, contrasena, matricula)` | Activa la cuenta e inicia sesion                                      |
| `forgotPassword(matricula)`                      | Envia una solicitud de recuperacion de contrasena                     |
| `refreshAuthToken()`                             | Renueva silenciosamente el token de acceso con el token de refresco   |
| `updateSessionUser(patch)`                       | Actualiza parcialmente el perfil de usuario en cache                  |
| `logout()`                                       | Elimina la sesion de memoria y almacenamiento local                   |

El layout de pestanas redirige automaticamente a `/login` si no hay sesion activa.

---

## Scripts Disponibles

| Comando                 | Descripcion                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `npm start`             | Inicia el servidor de desarrollo de Expo                             |
| `npm run android`       | Inicia la app en emulador Android                                    |
| `npm run ios`           | Inicia la app en simulador iOS                                       |
| `npm run web`           | Inicia la app en el navegador                                        |
| `npm run lint`          | Ejecuta ESLint en todo el proyecto                                   |
| `npm run reset-project` | Archiva el codigo inicial y reinicia el directorio `app/` desde cero |
