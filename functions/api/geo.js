/**
 * GET /api/geo
 *
 * Returns a coarse, human-readable location derived from Cloudflare's
 * native edge geolocation (request.cf) — no external IP/geo API needed.
 *
 * Nothing here is persisted server-side (no KV, no DB, no disk logging).
 * This endpoint is just a convenience for the frontend; the authoritative
 * location used for engagement logging is resolved independently and
 * server-side inside log.js.
 */

export function resolveLocation(cf) {
  if (!cf) return "Unknown";
  return cf.city || cf.region || cf.country || "Unknown";
}

export async function onRequestGet(context) {
  const location = resolveLocation(context.request.cf);

  return new Response(JSON.stringify({ location }), {
    headers: { "Content-Type": "application/json" },
  });
}
