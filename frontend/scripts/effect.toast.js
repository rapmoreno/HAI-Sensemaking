"use strict";

/**
 * Module: effect.toast.js
 * Type: Effect module
 * Purpose: Toast notification display
 *
 * Depends on:
 *   - effect.error.js (listens to app:error)
 *
 * Used by: main.js (auto-wired)
 * Side effects: DOM manipulation
 */

function showToast(message, type) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function initToastListeners() {
  document.addEventListener("app:error", (e) => {
    showToast(e.detail.error, "error");
  });

  document.addEventListener("app:toast", (e) => {
    showToast(e.detail.message, e.detail.type || "info");
  });
}

export { showToast, initToastListeners };
