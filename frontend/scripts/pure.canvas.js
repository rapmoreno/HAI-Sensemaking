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
    type: "step",
    title: "",
    description: "",
    ownership: "Both",
    dimensions: null,
  });
}

function createBranch(branchId) {
  return Object.freeze({
    id: branchId,
    condition: "",
    title: "",
    description: "",
    ownership: "Both",
    dimensions: null,
  });
}

function createSplit(stepId) {
  return Object.freeze({
    id: `step_${stepId}`,
    type: "split",
    branches: Object.freeze([
      createBranch(`${stepId}_b0`),
      createBranch(`${stepId}_b1`),
    ]),
  });
}

function addStep(state, stepId) {
  const step = createStep(stepId);
  return {
    ...state,
    steps: [...state.steps, step],
  };
}

function addSplit(state, stepId) {
  const split = createSplit(stepId);
  return {
    ...state,
    steps: [...state.steps, split],
  };
}

function deleteStep(state, stepId) {
  const filtered = state.steps.filter((s) => s.id !== stepId);
  return {
    ...state,
    steps: reindexSteps(filtered),
  };
}

function addBranch(state, splitStepId) {
  return {
    ...state,
    steps: state.steps.map((s) => {
      if (s.id !== splitStepId || s.type !== "split") return s;
      const nextIdx = s.branches.length;
      const branchId = `${splitStepId.replace("step_", "")}_b${nextIdx}`;
      return {
        ...s,
        branches: [...s.branches, createBranch(branchId)],
      };
    }),
  };
}

function deleteBranch(state, splitStepId, branchId) {
  return {
    ...state,
    steps: state.steps.map((s) => {
      if (s.id !== splitStepId || s.type !== "split") return s;
      const filtered = s.branches.filter((b) => b.id !== branchId);
      if (filtered.length < 2) return s;
      return { ...s, branches: filtered };
    }),
  };
}

function updateBranchField(state, splitStepId, branchId, field, value) {
  return {
    ...state,
    steps: state.steps.map((s) => {
      if (s.id !== splitStepId || s.type !== "split") return s;
      return {
        ...s,
        branches: s.branches.map((b) =>
          b.id === branchId ? { ...b, [field]: value } : b
        ),
      };
    }),
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
  return steps.map((s, i) => {
    const newId = `step_${i + 1}`;
    if (s.type === "split") {
      return {
        ...s,
        id: newId,
        branches: s.branches.map((b, bi) => ({
          ...b,
          id: `${i + 1}_b${bi}`,
        })),
      };
    }
    return { ...s, id: newId };
  });
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

/** Flatten steps for analysis: normal steps + each split branch as separate entry */
function flattenStepsForAnalysis(steps) {
  const flat = [];
  steps.forEach((s) => {
    const type = s.type || "step";
    if (type === "split") {
      s.branches.forEach((b) => {
        flat.push({
          id: b.id,
          title: b.title,
          description: b.description,
          ownership: b.ownership,
          branchContext: b.condition,
        });
      });
    } else {
      flat.push({
        id: s.id,
        title: s.title,
        description: s.description,
        ownership: s.ownership,
        branchContext: null,
      });
    }
  });
  return flat;
}

function mergeAnalysisResults(state, results) {
  return {
    ...state,
    analysing: false,
    steps: state.steps.map((step) => {
      if ((step.type || "step") === "split") {
        return {
          ...step,
          branches: step.branches.map((b) => {
            const result = results.find((r) => r.step_id === b.id);
            if (!result) return b;
            const dimensions = {};
            for (const [key, val] of Object.entries(result)) {
              if (key !== "step_id") dimensions[key] = val;
            }
            return { ...b, dimensions };
          }),
        };
      }
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
  const hasSteps = state.steps.some((s) => {
    if (s.type === "split") {
      return s.branches.some((b) => b.condition.trim() || b.title.trim());
    }
    return s.title.trim().length > 0;
  });
  return hasName && hasSteps;
}

export {
  createStep,
  createSplit,
  createBranch,
  addStep,
  addSplit,
  addBranch,
  deleteStep,
  deleteBranch,
  updateStepField,
  updateBranchField,
  reorderSteps,
  flattenStepsForAnalysis,
  mergeAnalysisResults,
  canAnalyse,
};
