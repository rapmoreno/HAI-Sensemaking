"use strict";

/**
 * Module: effect.export.js
 * Type: Effect module
 * Purpose: PDF export — POST /export, trigger blob download
 *
 * Depends on:
 *   - effect.error.js (error handling)
 *   - config.js (API_BASE)
 *
 * Used by: effect.report.js
 * Side effects: HTTP requests, DOM manipulation, file download
 */

import { handleError } from "./effect.error.js";
import { CONFIG } from "./config.js";

let _canvasState = null;
let _reportData = null;

function initExport(canvasState, reportData) {
  _canvasState = canvasState;
  _reportData = reportData;

  const btn = document.getElementById("btn-export-pdf");
  if (btn) {
    btn.disabled = false;
    btn.addEventListener("click", _handleExport);
  }
}

async function _handleExport() {
  const btn = document.getElementById("btn-export-pdf");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Exporting&hellip;';
  }

  const url = `${CONFIG.API_BASE}/export`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canvas_state: _canvasState,
        report: _reportData,
      }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(detail.detail?.message || detail.message || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const filenameMatch = disposition.match(/filename="(.+?)"/);
    const filename = filenameMatch ? filenameMatch[1] : "hai-canvas-report.pdf";

    _downloadBlob(blob, filename);

    document.dispatchEvent(
      new CustomEvent("app:toast", { detail: { message: "PDF exported", type: "success" } })
    );
  } catch (error) {
    handleError("effect.export", "_handleExport", error);

    document.dispatchEvent(
      new CustomEvent("app:toast", {
        detail: { message: `Export failed: ${error.message}`, type: "error" },
      })
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Export PDF";
    }
  }
}

function _downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { initExport };
