import { appConfig } from '../config';
import { clearSessionToken, clearSessionUser } from '../utils/authStorage';

const joinUrl = (baseUrl, path) => {
  const normalizedBase = String(baseUrl ?? '').replace(/\/$/, '');
  const normalizedPath = String(path ?? '').replace(/^\//, '');
  return `${normalizedBase}/${normalizedPath}`;
};

export function buildApiUrl(path) {
  return joinUrl(appConfig.apiBaseUrl, path);
}

export async function requestJson(path, options = {}) {
  if (!appConfig.useRemoteApi) {
    throw new Error('La API remota está deshabilitada en este entorno.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), appConfig.apiTimeoutMs);
  const { body, headers, signal, token, ...restOptions } = options;

  try {
    const response = await fetch(buildApiUrl(path), {
      ...restOptions,
      body: body ? JSON.stringify(body) : undefined,
      credentials: restOptions.credentials ?? 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: signal ?? controller.signal,
    });

    const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
    const hasJsonBody = contentType.includes('application/json');
    const canHaveBody = ![204, 205].includes(response.status);
    let data = null;

    if (canHaveBody && hasJsonBody) {
      data = await response.json().catch(() => null);
    } else if (canHaveBody) {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : null;
    }

    if (response.status === 401) {
      clearSessionUser();
      clearSessionToken();
    }

    if (!response.ok) {
      const error = new Error(data?.message ?? 'La solicitud al backend no se pudo completar.');
      error.status = response.status;
      error.code = data?.code ?? '';
      error.payload = data;
      throw error;
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
