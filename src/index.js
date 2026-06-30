/**
 * Worker entry point.
 *
 * Routes /api/* to hand-written handlers; everything else falls through
 * to the static assets binding (the contents of /public).
 */

import { handleGeo } from "./geo.js";
import { handleLog } from "./log.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/geo" && request.method === "GET") {
      return handleGeo(request);
    }

    if (url.pathname === "/api/log" && request.method === "POST") {
      return handleLog(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
