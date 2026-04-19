type RequestOptions = {
  token?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export const API_ENDPOINTS = {
  authLogin: normalizeEndpoint(
    process.env.EXPO_PUBLIC_AUTH_LOGIN_ENDPOINT ?? "/auth/login",
  ),
  authRegistro: normalizeEndpoint(
    process.env.EXPO_PUBLIC_AUTH_REGISTRO_ENDPOINT ?? "/auth/registro",
  ),
  authActivar: normalizeEndpoint(
    process.env.EXPO_PUBLIC_AUTH_ACTIVAR_ENDPOINT ?? "/auth/activar",
  ),
  authOlvidar: normalizeEndpoint(
    process.env.EXPO_PUBLIC_AUTH_OLVIDAR_ENDPOINT ?? "/auth/olvidar",
  ),
  authRefresh: normalizeEndpoint(
    process.env.EXPO_PUBLIC_AUTH_REFRESH_ENDPOINT ?? "/auth/refresh",
  ),
};

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "Falta configurar EXPO_PUBLIC_API_BASE_URL. Define la URL base del API en tus variables de entorno.",
    );
  }

  return API_BASE_URL;
}

function createHeaders(token?: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/x-www-form-urlencoded");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function unwrapPayload<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }

  return raw as T;
}

async function extractError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      mensaje?: string;
      message?: string;
      error?: string;
    };
    return (
      body.mensaje ??
      body.message ??
      body.error ??
      `Error HTTP ${response.status}`
    );
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

export async function postDatax<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const body = new URLSearchParams({
    datax: JSON.stringify(payload),
  });

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: createHeaders(options?.token),
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const raw = (await response.json()) as unknown;
  return unwrapPayload<T>(raw);
}
