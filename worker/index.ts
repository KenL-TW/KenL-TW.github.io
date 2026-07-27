interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const CHAT_UPSTREAM =
  "https://jj5xm6ff2a4wlp3t6kcw5vfcue0yeneo.lambda-url.ap-northeast-1.on.aws/";
const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 30_000;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

async function proxyChat(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Allow": "POST, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        "Allow": "POST, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Request body is too large." }, 413);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ error: "Content-Type must be application/json." }, 415);
  }

  const requestBody = await request.text();
  if (new TextEncoder().encode(requestBody).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Request body is too large." }, 413);
  }

  try {
    JSON.parse(requestBody);
  } catch {
    return jsonResponse({ error: "Request body must contain valid JSON." }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamHeaders = new Headers({
      "Content-Type": "application/json",
    });
    const clientToken = request.headers.get("x-client-token");
    if (clientToken) upstreamHeaders.set("x-client-token", clientToken);

    const upstream = await fetch(CHAT_UPSTREAM, {
      method: "POST",
      headers: upstreamHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type":
        upstream.headers.get("content-type") ||
        "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "AbortError";
    return jsonResponse(
      {
        error: timedOut
          ? "The portfolio guide timed out."
          : "The portfolio guide is temporarily unavailable.",
      },
      timedOut ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      return proxyChat(request);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not Found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
