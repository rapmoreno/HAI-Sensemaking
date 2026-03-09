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
      const detail = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(detail.detail?.message || detail.message || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    handleError("effect.api", "postAnalyse", error);
    throw error;
  }
}

export { postAnalyse };
