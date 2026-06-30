/**
 * POST /api/log
 *
 * Receives an engagement event from js/tracking.js and relays it to a
 * Google Sheet via a Google Apps Script Web App.
 *
 * Why this relay exists (instead of the browser calling Google directly):
 * Apps Script Web Apps log the caller's IP address. If the visitor's
 * browser called Google directly, their real IP would end up in our
 * analytics sheet. By routing the call through this Cloudflare Pages
 * Function, the *server-to-server* request to Google originates from
 * Cloudflare's edge — so only Cloudflare's IP ever reaches Google, and
 * the visitor's real IP never leaves Cloudflare's network at all.
 */

import { resolveLocation } from "./geo.js";

const ALLOWED_METRICS = ["page_view", "time_spent_30s", "scrolled_50_percent"];

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { metric, referral } = body || {};

  if (!ALLOWED_METRICS.includes(metric)) {
    return new Response(JSON.stringify({ error: "Invalid metric" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Location and timestamp are always derived server-side — never trust
  // client-supplied values for either field.
  const location = resolveLocation(request.cf);
  const timestamp = new Date().toISOString();

  const payload = {
    timestamp,
    location,
    metric,
    referral: typeof referral === "string" ? referral : "",
  };

  if (!env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.error("GOOGLE_SHEETS_WEBHOOK_URL is not configured");
    return new Response(JSON.stringify({ error: "Logging not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Fail silently from the visitor's perspective — never block or slow
    // down their page experience because Google Sheets is unreachable.
    // The error is still logged here so it's visible in Cloudflare's
    // Functions logs for debugging.
    console.error("Failed to relay engagement event to Google Sheets:", err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
