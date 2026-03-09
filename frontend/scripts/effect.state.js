"use strict";

/**
 * Module: effect.state.js
 * Type: Effect module
 * Purpose: Single state store — only file allowed to hold state
 *
 * Depends on: Nothing
 * Used by: effect.canvas.js, effect.api.js
 * Side effects: Dispatches app:state-changed custom event
 *
 * State is immutable via Object.freeze.
 * Reducer logic belongs in pure modules, not here.
 */

let _state = Object.freeze({
  mode: "solo",
  process_name: "",
  context_description: "",
  context_type: "Process / Workflow",
  steps: Object.freeze([]),
  analysing: false,
});

function getState() {
  return _state;
}

function updateState(reducerFn) {
  const prev = _state;
  const next = reducerFn(prev);
  _state = deepFreeze(next);

  document.dispatchEvent(
    new CustomEvent("app:state-changed", {
      detail: { prev, next: _state },
    })
  );

  return _state;
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

export { getState, updateState };
