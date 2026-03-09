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

  const btnExport = document.getElementById("btn-export-pdf");
  if (btnExport) {
    btnExport.disabled = false;
    btnExport.addEventListener("click", _handleExport);
  }

  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) {
    btnPrint.disabled = false;
    btnPrint.addEventListener("click", () => window.print());
  }
}

async function _handleExport() {
  const btn = document.getElementById("btn-export-pdf");
  if (btn) {
    btn.disabled = true;
    btn.replaceChildren();
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    btn.appendChild(spinner);
    btn.appendChild(document.createTextNode(" Exporting…"));
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
      const text = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const data = text ? JSON.parse(text) : {};
        msg = data?.detail?.message ?? data?.message ?? msg;
      } catch {
        if (text && text.length < 200) msg += ` — ${text}`;
      }
      if (res.status === 501) {
        msg += " Use Print → Save as PDF instead.";
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("Export returned empty file. Use Print → Save as PDF instead.");
    }

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
      btn.textContent = "Export PDF";
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
