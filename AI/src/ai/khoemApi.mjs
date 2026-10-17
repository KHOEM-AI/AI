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

export async function searchKhoemKnowledge(query, { exact = false } = {}) {
  const q = String(query ?? "").trim();
  if (!q || q.length > 200) return null;

  const data = await request(`/api/knowledge?q=${encodeURIComponent(q)}${exact ? "&exact=1" : ""}`);
  if (data?.found === true && typeof data.answer === "string" && data.answer.trim()) {
    return data.answer;
  }
  return null;
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

export async function searchKhoemKhmer(query) {
  const q = String(query ?? "").trim();
  if (!q || q.length > 200) return null;
  const data = await request(`/api/khmer?q=${encodeURIComponent(q)}&exact=1`);
  return data?.found === true && typeof data.answer === "string" && data.answer.trim() ? data.answer : null;
}
