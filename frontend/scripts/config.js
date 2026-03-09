"use strict";

/**
 * Module: config.js
 * Type: Config
 * Purpose: Constants, URLs, flags
 *
 * Depends on: Nothing
 * Used by: All effect and pure modules
 * Side effects: None
 */

const CONFIG = Object.freeze({
  API_BASE: "/api/v1",
  CONTEXT_TYPES: Object.freeze([
    "Process / Workflow",
    "Service Design",
    "Product Feature",
    "Decision Pipeline",
    "Customer Journey",
    "Internal Operations",
  ]),
});

export { CONFIG };
