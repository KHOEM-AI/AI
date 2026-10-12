import { checkJsonBody } from "./inputGuard";

// One fetch path for the whole UI: every /api request is checked here, and every
// INVALID_INPUT answer from the server is shown to the user immediately.
const w = window as unknown as { __khoemInputGuard?: boolean };
if (!w.__khoemInputGuard) {
  w.__khoemInputGuard = true;
  const original = window.fetch.bind(window);
  const urlOf = (i: RequestInfo | URL): string =>
    typeof i === "string" ? i : i instanceof URL ? i.pathname : i.url;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const isApi = urlOf(input).startsWith("/api");
    if (isApi && typeof init?.body === "string") {
      const problem = checkJsonBody(init.body);
      if (problem) {
        window.alert(problem);
        return new Response(JSON.stringify({ error: problem, code: "INVALID_INPUT" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    const res = await original(input, init);
    if (isApi && (res.status === 400 || res.status === 413)) {
      const d = await res.clone().json().catch(() => null);
      if (d && d.code === "INVALID_INPUT") window.alert(String(d.error));
    }
    return res;
  };
}
