// One shared fetch helper for the dashboard panels (replaces 5 local copies).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const unwrap = (j: Any): Any => (j && typeof j === "object" && "result" in j ? j.result : j);

async function send(url: string, opts: RequestInit) {
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  return { r, json: (await r.json()) as Any };
}

/** Raw JSON, no unwrapping. */
export async function apiRaw(url: string, opts: RequestInit = {}): Promise<Any> {
  return (await send(url, opts)).json;
}

/** Unwraps { result }, never throws on HTTP errors. */
export async function api(url: string, opts: RequestInit = {}): Promise<Any> {
  return unwrap((await send(url, opts)).json);
}

/** Unwraps { result }, throws Error on HTTP errors. */
export async function apiStrict(url: string, opts: RequestInit = {}): Promise<Any> {
  const { r, json } = await send(url, opts);
  if (!r.ok) {
    const message =
      json && typeof json === "object" && "error" in json ? String(json.error)
      : json && typeof json === "object" && "message" in json ? String(json.message)
      : `HTTP ${r.status} ${r.statusText}`;
    throw new Error(message);
  }
  return unwrap(json);
}
