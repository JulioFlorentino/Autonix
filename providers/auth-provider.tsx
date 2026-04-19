import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { API_ENDPOINTS, postDatax } from "@/services/api-client";

const STORAGE_KEY = "autonix_auth_session";

type AuthUser = {
  id: string | number;
  nombre: string;
  apellido: string;
  correo: string;
  fotoUrl?: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
  refreshToken: string;
};

type LoginResult = {
  id: string | number;
  nombre: string;
  apellido: string;
  correo: string;
  fotoUrl?: string;
  token: string;
  refreshToken: string;
};

type ForgotPasswordResponse = {
  mensaje?: string;
  message?: string;
};

type RegistroResponse = {
  tokenTemporal?: string;
  token?: string;
  temporalToken?: string;
  mensaje?: string;
  message?: string;
};

type ActivarResponse = {
  id?: string | number;
  nombre?: string;
  apellido?: string;
  correo?: string;
  fotoUrl?: string;
  token: string;
  refreshToken: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  login: (matricula: string, contrasena: string) => Promise<void>;
  register: (matricula: string) => Promise<string>;
  activate: (
    tokenTemporal: string,
    contrasena: string,
    matricula: string,
  ) => Promise<void>;
  forgotPassword: (matricula: string) => Promise<string>;
  refreshAuthToken: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado. Intenta nuevamente.";
}

function normalizeMatricula(rawMatricula: string): string {
  return rawMatricula.replace(/[\s-]/g, "").trim();
}

async function persistSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function loadSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function resolveTemporaryToken(payload: RegistroResponse): string {
  const token = payload.tokenTemporal ?? payload.temporalToken ?? payload.token;

  if (!token) {
    throw new Error(
      "No se recibio token temporal en la respuesta de registro.",
    );
  }

  return token;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const storedSession = await loadSession();
        if (!isMounted || !storedSession) {
          return;
        }

        setSession(storedSession);

        if (storedSession.refreshToken) {
          try {
            const refreshResponse: LoginResult = await postDatax(
              API_ENDPOINTS.authRefresh,
              { refreshToken: storedSession.refreshToken },
              { token: storedSession.token },
            );

            const updatedSession: AuthSession = {
              user: {
                id: refreshResponse.id,
                nombre: refreshResponse.nombre,
                apellido: refreshResponse.apellido,
                correo: refreshResponse.correo,
                fotoUrl: refreshResponse.fotoUrl,
              },
              token: refreshResponse.token,
              refreshToken: refreshResponse.refreshToken,
            };

            if (isMounted) {
              setSession(updatedSession);
              await persistSession(updatedSession);
            }
          } catch {
            if (isMounted) {
              setSession(null);
              await persistSession(null);
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isLoading,
    login: async (matricula, contrasena) => {
      try {
        const normalizedMatricula = normalizeMatricula(matricula);
        const response: LoginResult = await postDatax(API_ENDPOINTS.authLogin, {
          matricula: normalizedMatricula,
          contrasena,
        });

        const newSession: AuthSession = {
          user: {
            id: response.id,
            nombre: response.nombre,
            apellido: response.apellido,
            correo: response.correo,
            fotoUrl: response.fotoUrl,
          },
          token: response.token,
          refreshToken: response.refreshToken,
        };

        setSession(newSession);
        await persistSession(newSession);
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    register: async (matricula) => {
      try {
        const normalizedMatricula = normalizeMatricula(matricula);
        const response: RegistroResponse = await postDatax(
          API_ENDPOINTS.authRegistro,
          {
            matricula: normalizedMatricula,
          },
        );

        return resolveTemporaryToken(response);
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    activate: async (tokenTemporal, contrasena, matricula) => {
      try {
        const normalizedMatricula = normalizeMatricula(matricula);
        const response: ActivarResponse = await postDatax(
          API_ENDPOINTS.authActivar,
          {
            token: tokenTemporal,
            contrasena,
          },
        );

        const activatedSession: AuthSession = {
          user: {
            id: response.id ?? normalizedMatricula,
            nombre: response.nombre ?? normalizedMatricula,
            apellido: response.apellido ?? "",
            correo: response.correo ?? "",
            fotoUrl: response.fotoUrl,
          },
          token: response.token,
          refreshToken: response.refreshToken,
        };

        setSession(activatedSession);
        await persistSession(activatedSession);
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    forgotPassword: async (matricula) => {
      try {
        const normalizedMatricula = normalizeMatricula(matricula);
        const response: ForgotPasswordResponse = await postDatax(
          API_ENDPOINTS.authOlvidar,
          {
            matricula: normalizedMatricula,
          },
        );

        return (
          response.mensaje ??
          response.message ??
          "Contrasena temporal enviada correctamente."
        );
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    refreshAuthToken: async () => {
      if (!session?.refreshToken) {
        throw new Error("No hay refresh token disponible.");
      }

      const refreshResponse: LoginResult = await postDatax(
        API_ENDPOINTS.authRefresh,
        { refreshToken: session.refreshToken },
        { token: session.token },
      );

      const updatedSession: AuthSession = {
        user: {
          id: refreshResponse.id,
          nombre: refreshResponse.nombre,
          apellido: refreshResponse.apellido,
          correo: refreshResponse.correo,
          fotoUrl: refreshResponse.fotoUrl,
        },
        token: refreshResponse.token,
        refreshToken: refreshResponse.refreshToken,
      };

      setSession(updatedSession);
      await persistSession(updatedSession);
    },
    logout: async () => {
      setSession(null);
      await persistSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
