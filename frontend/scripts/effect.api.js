"use strict";

/**
 * Module: effect.api.js
 * Type: Effect module
 * Purpose: API calls to backend — fetch /analyse
 *
 * Depends on:
 *   - effect.error.js (error handling)
 *   - config.js (API_BASE)
 *
 * Used by: effect.canvas.js
 * Side effects: HTTP requests
 */

import { handleError } from "./effect.error.js";
import { CONFIG } from "./config.js";

async function postAnalyse(canvasPayload) {
  const url = `${CONFIG.API_BASE}/analyse`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canvasPayload),
    });

    if (!res.ok) {
      let message = `HTTP ${res.status} ${res.statusText}`;
      const text = await res.text();
      try {
        const body = JSON.parse(text);
        message = body.detail?.message ?? body.message ?? message;
      } catch {
        if (text && text.length < 200) message += ` — ${text}`;
      }
      const err = new Error(`${message} (${res.method} ${url})`);
      handleError("effect.api", "postAnalyse", err, { status: res.status, url });
      throw err;
    }

    return await res.json();
  } catch (error) {
    handleError("effect.api", "postAnalyse", error, { url });
    throw error;
  }
}

export { postAnalyse };
