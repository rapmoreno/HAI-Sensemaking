"use strict";

/**
 * Module: effect.error.js
 * Type: Effect module
 * Purpose: Centralized error handler — all errors go through here
 *
 * Depends on: Nothing
 * Used by: All effect modules
 * Side effects: Console logging, DOM toast dispatch
 */

function handleError(module, fn, error, context) {
  const entry = {
    timestamp: new Date().toISOString(),
    module,
    function: fn,
    error: error.message || String(error),
    context: context || null,
  };

  const ctxStr = context ? ` ${JSON.stringify(context)}` : "";
  console.error(`[${module}.${fn}]`, entry.error, ctxStr);

  document.dispatchEvent(
    new CustomEvent("app:error", { detail: entry })
  );

  return entry;
}

function withErrorHandling(module, fn, asyncFn) {
  return async function (...args) {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(module, fn, error);
      throw error;
    }
  };
}

export { handleError, withErrorHandling };
