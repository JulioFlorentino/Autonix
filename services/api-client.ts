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
  profile: normalizeEndpoint(
    process.env.EXPO_PUBLIC_PROFILE_ENDPOINT ?? "/perfil",
  ),
  profilePhoto: normalizeEndpoint(
    process.env.EXPO_PUBLIC_PROFILE_PHOTO_ENDPOINT ?? "/perfil/foto",
  ),
  vehiculos: normalizeEndpoint(
    process.env.EXPO_PUBLIC_VEHICULOS_ENDPOINT ?? "/vehiculos",
  ),
  vehiculosDetalle: normalizeEndpoint(
    process.env.EXPO_PUBLIC_VEHICULOS_DETALLE_ENDPOINT ?? "/vehiculos/detalle",
  ),
  vehiculosEditar: normalizeEndpoint(
    process.env.EXPO_PUBLIC_VEHICULOS_EDITAR_ENDPOINT ?? "/vehiculos/editar",
  ),
  vehiculosFoto: normalizeEndpoint(
    process.env.EXPO_PUBLIC_VEHICULOS_FOTO_ENDPOINT ?? "/vehiculos/foto",
  ),
  foroCrear: normalizeEndpoint(
    process.env.EXPO_PUBLIC_FORO_CREAR_ENDPOINT ?? "/foro/crear",
  ),
  foroTemas: normalizeEndpoint(
    process.env.EXPO_PUBLIC_FORO_TEMAS_ENDPOINT ?? "/foro/temas",
  ),
  foroDetalle: normalizeEndpoint(
    process.env.EXPO_PUBLIC_FORO_DETALLE_ENDPOINT ?? "/foro/detalle",
  ),
  foroResponder: normalizeEndpoint(
    process.env.EXPO_PUBLIC_FORO_RESPONDER_ENDPOINT ?? "/foro/responder",
  ),
  foroMisTemas: normalizeEndpoint(
    process.env.EXPO_PUBLIC_FORO_MIS_TEMAS_ENDPOINT ?? "/foro/mis-temas",
  ),
  noticias: normalizeEndpoint(
    process.env.EXPO_PUBLIC_NOTICIAS_ENDPOINT ?? "/noticias",
  ),
  noticiasDetalle: normalizeEndpoint(
    process.env.EXPO_PUBLIC_NOTICIAS_DETALLE_ENDPOINT ?? "/noticias/detalle",
  ),
  videos: normalizeEndpoint(
    process.env.EXPO_PUBLIC_VIDEOS_ENDPOINT ?? "/videos",
  ),
  catalogo: normalizeEndpoint(
    process.env.EXPO_PUBLIC_CATALOGO_ENDPOINT ?? "/catalogo",
  ),
  catalogoDetalle: normalizeEndpoint(
    process.env.EXPO_PUBLIC_CATALOGO_DETALLE_ENDPOINT ?? "/catalogo/detalle",
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

function createAuthHeaders(token?: string): Headers {
  const headers = new Headers();

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

export async function getJson<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "GET",
    headers: createAuthHeaders(options?.token),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const raw = (await response.json()) as unknown;
  return unwrapPayload<T>(raw);
}

export async function postMultipart<T>(
  endpoint: string,
  formData: FormData,
  options?: RequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: createAuthHeaders(options?.token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const raw = (await response.json()) as unknown;
  return unwrapPayload<T>(raw);
}
