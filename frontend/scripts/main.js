"use strict";

/**
 * Module: main.js
 * Type: Entry point
 * Purpose: Bootstrap app — detect page, init modules
 *
 * Depends on:
 *   - effect.toast.js (toast system)
 *   - effect.canvas.js (canvas page)
 *   - effect.report.js (report page)
 *
 * Used by: HTML pages via <script>
 * Side effects: Module initialization
 */

import { initToastListeners } from "./effect.toast.js";

initToastListeners();

const path = window.location.pathname;

if (path.includes("canvas")) {
  import("./effect.canvas.js").then((mod) => mod.initCanvas());
} else if (path.includes("report")) {
  import("./effect.report.js").then((mod) => mod.initReport());
}
