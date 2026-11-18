import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }
      if (url.pathname === "/health" || url.pathname === "/api/v1/health") {
        return new Response(
          JSON.stringify({ status: "healthy", service: "frontend-ssr", timestamp: new Date().toISOString() }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (url.pathname.startsWith("/api/v1/")) {
        const backendOrigin = (process.env.BACKEND_API_ORIGIN || "https://bag-azlo.onrender.com").replace(/\/+$/, "");
        const targetUrl = `${backendOrigin}${url.pathname}${url.search}`;
        const fwdHeaders = new Headers();
        for (const key of ["accept", "authorization", "content-type", "cookie", "x-visitor-id"]) {
          const val = request.headers.get(key);
          if (val) fwdHeaders.set(key, val);
        }
        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: fwdHeaders,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
        });
        const respHeaders = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) respHeaders.set("content-type", ct);
        const sc = upstream.headers.get("set-cookie");
        if (sc) respHeaders.set("set-cookie", sc);
        return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
