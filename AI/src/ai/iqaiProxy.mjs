import { Readable } from "node:stream";

const ALLOWED_ROOTS = new Set([
  "media",
  "sounds",
  "audio",
  "images",
  "videos",
  "jobs",
]);

const REQUEST_HEADERS = [
  "content-type",
  "content-length",
  "range",
  "if-range",
  "x-filename",
  "x-category",
  "x-tags",
  "x-source",
  "x-license",
];

const RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
  "cache-control",
  "etag",
  "last-modified",
];

export function createIqaiProxy({
  baseUrl = process.env.IQAI_BASE_URL || "http://127.0.0.1:8799",
  token = process.env.IQAI_TOKEN || "",
  isOwnUi = () => false,
} = {}) {
  let upstreamBase;

  try {
    upstreamBase = new URL(baseUrl);

    if (
      !["http:", "https:"].includes(upstreamBase.protocol) ||
      upstreamBase.username ||
      upstreamBase.password
    ) {
      throw new Error("Invalid IQAI_BASE_URL");
    }
  } catch {
    throw new Error("IQAI_BASE_URL is invalid");
  }

  return async function iqaiProxy(req, res) {
    if (!isOwnUi(req)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    if (!token) {
      res.status(503).json({ error: "iqai_not_configured" });
      return;
    }

    if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
      res.set("Allow", "GET, POST, PATCH, DELETE");
      res.status(405).end();
      return;
    }

    let incoming;

    try {
      incoming = new URL(req.originalUrl, "http://localhost");
    } catch {
      res.status(400).end();
      return;
    }

    const prefix = "/api/iq-ai/";
    if (!incoming.pathname.startsWith(prefix)) {
      res.status(404).end();
      return;
    }

    const rawPath = incoming.pathname.slice(prefix.length);
    const segments = rawPath.split("/");

    try {
      for (const segment of segments) {
        const decoded = decodeURIComponent(segment);

        if (
          decoded === "." ||
          decoded === ".." ||
          decoded.includes("/") ||
          decoded.includes("\\") ||
          decoded.includes("\0")
        ) {
          res.status(400).end();
          return;
        }
      }
    } catch {
      res.status(400).end();
      return;
    }

    if (!rawPath || !ALLOWED_ROOTS.has(segments[0])) {
      res.status(404).json({ error: "route_not_allowed" });
      return;
    }

    const target = new URL(
      `/api/v1/${rawPath}${incoming.search}`,
      upstreamBase
    );

    const headers = new Headers();

    for (const name of REQUEST_HEADERS) {
      const value = req.headers[name];
      if (value !== undefined) headers.set(name, value);
    }

    headers.set("authorization", `Bearer ${token}`);

    const controller = new AbortController();

    req.on("aborted", () => controller.abort());

    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });

    try {
      const options = {
        method: req.method,
        headers,
        signal: controller.signal,
      };

      if (!["GET"].includes(req.method)) {
        if (req.body !== undefined) {
          const body = Buffer.from(JSON.stringify(req.body));
          options.body = body;
          headers.set("content-type", "application/json");
          headers.set("content-length", String(body.length));
        } else if (!req.readableEnded) {
          options.body = req;
          options.duplex = "half";
        }
      }

      const upstream = await fetch(target, options);

      const outgoingHeaders = {};

      for (const name of RESPONSE_HEADERS) {
        const value = upstream.headers.get(name);
        if (value !== null) outgoingHeaders[name] = value;
      }

      res.status(upstream.status);

      for (const [name, value] of Object.entries(outgoingHeaders)) {
        res.set(name, value);
      }

      if (!upstream.body) {
        res.end();
        return;
      }

      Readable.fromWeb(upstream.body)
        .on("error", () => res.destroy())
        .pipe(res);
    } catch (err) {
      if (controller.signal.aborted) return;

      console.error("[IQ-AI Proxy]", err.message);

      if (!res.headersSent) {
        res.status(502).json({
          error: "iqai_upstream_unavailable",
        });
      } else {
        res.destroy();
      }
    }
  };
}
