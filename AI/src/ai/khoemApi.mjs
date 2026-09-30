const KHOEM_API_URL = process.env.KHOEM_API_URL ?? "http://127.0.0.1:8790";

async function request(path, options = {}) {
  const response = await fetch(`${KHOEM_API_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(3000),
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `KHOEM_AI API error: ${response.status}`;
    throw new Error(message);
  }

  return body?.data;
}

export async function getKhoemLanguages() {
  return request("/api/languages");
}

export async function getKhoemLocales() {
  return request("/api/locales");
}

export async function getKhoemCoverage() {
  return request("/api/coverage");
}

export async function khoemTranslate(locale, key, params) {
  return request("/api/translate", {
    method: "POST",
    body: JSON.stringify({ locale, key, ...(params ? { params } : {}) }),
  });
}

export async function khoemApiHealth() {
  return request("/health");
}
