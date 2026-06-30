/**
 * Anonymous engagement tracking.
 *
 * Tracks three events, each at most once per page session, using only
 * in-memory flags (no localStorage/cookies/persistent visitor ID).
 * No IP, user agent, or device data is collected here — the server-side
 * relay (functions/api/log.js) attaches location and timestamp instead.
 */

(function () {
  "use strict";

  // In-memory "fired" flags — reset on every page load, never persisted.
  const fired = {
    page_view: false,
    time_spent_30s: false,
    scrolled_50_percent: false,
  };

  /**
   * Sends one engagement event to the logging relay.
   * keepalive:true lets the request survive page unload (e.g. user
   * navigating away right as a scroll/time event fires).
   */
  function sendEvent(metric) {
    if (fired[metric]) return;
    fired[metric] = true;

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        metric: metric,
        referral: window.location.pathname,
      }),
    }).catch(() => {
      // Fail silently — engagement tracking must never disrupt the visitor.
    });
  }

  // ---- 1. page_view: fires immediately on load ----
  sendEvent("page_view");

  // ---- 2. time_spent_30s: fires once after 30s of *visible* time ----
  // Pauses while the tab is hidden so background tabs don't falsely count.
  (function trackTimeSpent() {
    const THRESHOLD_MS = 30000;
    let accumulatedMs = 0;
    let lastTickStart = document.visibilityState === "visible" ? Date.now() : null;
    let intervalId = null;

    function checkThreshold() {
      if (lastTickStart !== null) {
        accumulatedMs += Date.now() - lastTickStart;
        lastTickStart = Date.now();
      }
      if (accumulatedMs >= THRESHOLD_MS) {
        sendEvent("time_spent_30s");
        clearInterval(intervalId);
      }
    }

    intervalId = setInterval(checkThreshold, 1000);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        lastTickStart = Date.now();
      } else {
        if (lastTickStart !== null) {
          accumulatedMs += Date.now() - lastTickStart;
          lastTickStart = null;
        }
      }
    });
  })();

  // ---- 3. scrolled_50_percent: fires once past 50% of page height ----
  // Throttled so the scroll listener doesn't run on every pixel of scroll.
  (function trackScrollDepth() {
    let throttled = false;

    function checkScrollDepth() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return; // page shorter than viewport — no scroll possible

      const scrolledPercent = (scrollTop / docHeight) * 100;
      if (scrolledPercent >= 50) {
        sendEvent("scrolled_50_percent");
        window.removeEventListener("scroll", onScroll);
      }
    }

    function onScroll() {
      if (throttled) return;
      throttled = true;
      window.requestAnimationFrame(() => {
        checkScrollDepth();
        throttled = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  })();
})();
