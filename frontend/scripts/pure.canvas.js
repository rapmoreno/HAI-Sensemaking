"use strict";

/**
 * Module: pure.canvas.js
 * Type: Pure module
 * Purpose: Canvas state reducers and step logic — deterministic, no side effects
 *
 * Depends on: Nothing
 * Used by: effect.canvas.js
 * Side effects: None
 */

function createStep(id) {
  return Object.freeze({
    id: `step_${id}`,
    title: "",
    description: "",
    ownership: "Both",
    dimensions: null,
  });
}

function addStep(state, stepId) {
  const step = createStep(stepId);
  return {
    ...state,
    steps: [...state.steps, step],
  };
}

function deleteStep(state, stepId) {
  const filtered = state.steps.filter((s) => s.id !== stepId);
  return {
    ...state,
    steps: reindexSteps(filtered),
  };
}

function updateStepField(state, stepId, field, value) {
  return {
    ...state,
    steps: state.steps.map((s) =>
      s.id === stepId ? { ...s, [field]: value } : s
    ),
  };
}

function reindexSteps(steps) {
  return steps.map((s, i) => ({ ...s, id: `step_${i + 1}` }));
}

function reorderSteps(state, fromId, toId) {
  const steps = [...state.steps];
  const fromIdx = steps.findIndex((s) => s.id === fromId);
  const toIdx = steps.findIndex((s) => s.id === toId);
  if (fromIdx === -1 || toIdx === -1) return state;

  const [moved] = steps.splice(fromIdx, 1);
  steps.splice(toIdx, 0, moved);

  return {
    ...state,
    steps: reindexSteps(steps),
  };
}

function mergeAnalysisResults(state, results) {
  return {
    ...state,
    analysing: false,
    steps: state.steps.map((step) => {
      const result = results.find((r) => r.step_id === step.id);
      if (!result) return step;

      const dimensions = {};
      for (const [key, val] of Object.entries(result)) {
        if (key !== "step_id") dimensions[key] = val;
      }
      return { ...step, dimensions };
    }),
  };
}

function canAnalyse(state) {
  const hasName = state.process_name.trim().length > 0;
  const hasSteps = state.steps.some((s) => s.title.trim().length > 0);
  return hasName && hasSteps;
}

export {
  createStep,
  addStep,
  deleteStep,
  updateStepField,
  reorderSteps,
  mergeAnalysisResults,
  canAnalyse,
};
