"use strict";

/**
 * Module: effect.canvas.js
 * Type: Effect module
 * Purpose: Canvas DOM manipulation — renders state, wires events, drag-drop
 *
 * Depends on:
 *   - effect.error.js (error handling)
 *   - effect.state.js (getState, updateState)
 *   - effect.api.js (postAnalyse)
 *   - pure.canvas.js (reducers)
 *   - pure.render.js (HTML templates)
 *   - config.js (CONTEXT_TYPES)
 *   - effect.facilitated.js (facilitated mode)
 *
 * Used by: main.js
 * Side effects: DOM reads/writes, event listeners, API calls
 */

import { handleError } from "./effect.error.js";
import { getState, updateState } from "./effect.state.js";
import { postAnalyse } from "./effect.api.js";
import { initFacilitated, advanceToReport } from "./effect.facilitated.js";
import {
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
} from "./pure.canvas.js";
import { renderStepCardHtml } from "./pure.render.js";
import { CONFIG } from "./config.js";

let _nextStepId = 1;
let _draggedId = null;
let _analysed = false;

function initCanvas() {
  const mode = new URLSearchParams(window.location.search).get("mode") || "solo";
  updateState((s) => ({ ...s, mode }));

  const modeBadge = document.getElementById("mode-badge");
  if (modeBadge) modeBadge.textContent = mode === "facilitated" ? "Facilitated" : "Solo";

  _populateContextTypes();
  _wireGlobalListeners();
  _render();

  if (mode === "facilitated") {
    initFacilitated();
  }
}

function _populateContextTypes() {
  const select = document.getElementById("context-type");
  if (!select) return;
  CONFIG.CONTEXT_TYPES.forEach((ct) => {
    const opt = document.createElement("option");
    opt.value = ct;
    opt.textContent = ct;
    select.appendChild(opt);
  });
}

function _wireGlobalListeners() {
  const processName = document.getElementById("process-name");
  const contextDesc = document.getElementById("context-desc");
  const contextType = document.getElementById("context-type");
  const btnAdd = document.getElementById("btn-add-step");
  const btnAnalyse = document.getElementById("btn-analyse");

  if (processName) {
    processName.addEventListener("input", (e) => {
      updateState((s) => ({ ...s, process_name: e.target.value }));
      _updateAnalyseButton();
    });
  }
  if (contextDesc) {
    contextDesc.addEventListener("input", (e) => {
      updateState((s) => ({ ...s, context_description: e.target.value }));
    });
  }
  if (contextType) {
    contextType.addEventListener("change", (e) => {
      updateState((s) => ({ ...s, context_type: e.target.value }));
    });
  }
  if (btnAdd) {
    btnAdd.addEventListener("click", _handleAddStep);
  }
  const btnAddSplit = document.getElementById("btn-add-split");
  if (btnAddSplit) {
    btnAddSplit.addEventListener("click", _handleAddSplit);
  }
  if (btnAnalyse) {
    btnAnalyse.addEventListener("click", _handleAnalyse);
  }

  const btnReport = document.getElementById("btn-report");
  if (btnReport) {
    btnReport.addEventListener("click", _handleGenerateReport);
  }

  document.addEventListener("app:state-changed", () => {
    _updateAnalyseButton();
    _updateReportButton();
  });
}

function _handleAddStep() {
  updateState((s) => addStep(s, _nextStepId++));
  _render();

  const container = document.getElementById("steps-container");
  const lastCard = container ? container.lastElementChild : null;
  if (lastCard) {
    const titleInput = lastCard.querySelector(".step-card__title-input");
    if (titleInput) titleInput.focus();
  }
}

function _handleAddSplit() {
  updateState((s) => addSplit(s, _nextStepId++));
  _render();

  const container = document.getElementById("steps-container");
  const lastCard = container ? container.lastElementChild : null;
  if (lastCard) {
    const firstCond = lastCard.querySelector(".split-branch__condition");
    if (firstCond) firstCond.focus();
  }
}

async function _handleAnalyse() {
  const btnAnalyse = document.getElementById("btn-analyse");

  updateState((s) => ({ ...s, analysing: true }));
  if (btnAnalyse) {
    btnAnalyse.disabled = true;
    btnAnalyse.replaceChildren();
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    btnAnalyse.appendChild(spinner);
    btnAnalyse.appendChild(document.createTextNode(" Analysing…"));
  }

  try {
    const state = getState();
    const flatSteps = flattenStepsForAnalysis(state.steps);
    const payload = {
      process_name: state.process_name,
      context_description: state.context_description,
      context_type: state.context_type,
      steps: flatSteps.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        ownership: s.ownership,
        ...(s.branchContext && { branch_context: s.branchContext }),
      })),
    };

    const data = await postAnalyse(payload);
    updateState((s) => mergeAnalysisResults(s, data.steps || []));
    _render();

    _analysed = true;

    document.dispatchEvent(
      new CustomEvent("app:toast", { detail: { message: "Analysis complete", type: "success" } })
    );
  } catch (error) {
    handleError("effect.canvas", "_handleAnalyse", error);
  } finally {
    updateState((s) => ({ ...s, analysing: false }));
    if (btnAnalyse) {
      btnAnalyse.textContent = "Analyse";
    }
    _updateAnalyseButton();
  }
}

function _render() {
  const container = document.getElementById("steps-container");
  const emptyState = document.getElementById("empty-state");
  if (!container) return;

  const state = getState();
  const hasSteps = state.steps.length > 0;

  if (emptyState) emptyState.style.display = hasSteps ? "none" : "block";

  container.replaceChildren();

  state.steps.forEach((step, idx) => {
    const card = document.createElement("div");
    card.className = "step-card";
    card.dataset.stepId = step.id;
    card.dataset.stepType = step.type || "step";
    card.innerHTML = renderStepCardHtml(step, idx);

    if ((step.type || "step") === "split") {
      _wireSplitCardEvents(card, step);
    } else {
      _wireCardEvents(card, step);
    }
    container.appendChild(card);
  });
}

function _wireCardEvents(card, step) {
  const handle = card.querySelector(".step-card__handle");
  if (handle) {
    handle.addEventListener("dragstart", (e) => {
      _draggedId = step.id;
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    handle.addEventListener("dragend", () => {
      _draggedId = null;
      document.querySelectorAll(".step-card").forEach((c) => {
        c.classList.remove("dragging", "drag-over");
      });
    });
  }

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    card.classList.add("drag-over");
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    if (_draggedId && _draggedId !== step.id) {
      updateState((s) => reorderSteps(s, _draggedId, step.id));
      _render();
    }
  });

  card.querySelector(".step-card__title-input").addEventListener("input", (e) => {
    updateState((s) => updateStepField(s, step.id, "title", e.target.value));
  });

  card.querySelector(".step-card__desc-input").addEventListener("input", (e) => {
    updateState((s) => updateStepField(s, step.id, "description", e.target.value));
  });

  card.querySelectorAll(".ownership-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      updateState((s) => updateStepField(s, step.id, "ownership", pill.dataset.value));
      card.querySelectorAll(".ownership-pill").forEach((p) => {
        p.classList.toggle("active", p.dataset.value === pill.dataset.value);
      });
    });
  });

  card.querySelector(".step-card__delete").addEventListener("click", () => {
    const state = getState();
    const s = state.steps.find((st) => st.id === step.id);
    if (s && s.title && !confirm(`Delete "${s.title}"?`)) return;
    updateState((st) => deleteStep(st, step.id));
    _render();
  });
}

function _wireSplitCardEvents(card, split) {
  const handle = card.querySelector(".step-card__handle");
  if (handle) {
    handle.addEventListener("dragstart", (e) => {
      _draggedId = split.id;
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    handle.addEventListener("dragend", () => {
      _draggedId = null;
      document.querySelectorAll(".step-card").forEach((c) => {
        c.classList.remove("dragging", "drag-over");
      });
    });
  }

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    card.classList.add("drag-over");
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    if (_draggedId && _draggedId !== split.id) {
      updateState((s) => reorderSteps(s, _draggedId, split.id));
      _render();
    }
  });

  card.querySelectorAll(".split-branch__condition").forEach((input) => {
    input.addEventListener("input", (e) => {
      updateState((s) =>
        updateBranchField(s, split.id, e.target.dataset.branchId, "condition", e.target.value)
      );
    });
  });
  card.querySelectorAll(".split-branch__title").forEach((input) => {
    input.addEventListener("input", (e) => {
      updateState((s) =>
        updateBranchField(s, split.id, e.target.dataset.branchId, "title", e.target.value)
      );
    });
  });
  card.querySelectorAll(".split-branch__desc").forEach((textarea) => {
    textarea.addEventListener("input", (e) => {
      updateState((s) =>
        updateBranchField(s, split.id, e.target.dataset.branchId, "description", e.target.value)
      );
    });
  });
  card.querySelectorAll(".split-branch").forEach((branchEl) => {
    branchEl.querySelectorAll(".ownership-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const branchId = pill.dataset.branchId;
        updateState((s) =>
          updateBranchField(s, split.id, branchId, "ownership", pill.dataset.value)
        );
        branchEl.querySelectorAll(".ownership-pill").forEach((p) => {
          p.classList.toggle("active", p.dataset.value === pill.dataset.value);
        });
      });
    });
    const delBtn = branchEl.querySelector(".split-branch__delete");
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        const branchId = delBtn.dataset.branchId;
        if (!confirm("Remove this branch?")) return;
        updateState((s) => deleteBranch(s, split.id, branchId));
        _render();
      });
    }
  });
  const addBranchBtn = card.querySelector(".split-add-branch");
  if (addBranchBtn) {
    addBranchBtn.addEventListener("click", () => {
      updateState((s) => addBranch(s, split.id));
      _render();
    });
  }
  card.querySelector(".step-card__delete").addEventListener("click", () => {
    if (!confirm("Delete this split and all its branches?")) return;
    updateState((s) => deleteStep(s, split.id));
    _render();
  });
}

function _handleGenerateReport() {
  const state = getState();
  if (state.mode === "facilitated") {
    advanceToReport();
  }
  sessionStorage.setItem("hai_canvas_state", JSON.stringify(state));
  window.location.href = "/report.html";
}

function _updateAnalyseButton() {
  const btn = document.getElementById("btn-analyse");
  if (btn) {
    const state = getState();
    btn.disabled = !canAnalyse(state) || state.analysing;
  }
}

function _updateReportButton() {
  const btn = document.getElementById("btn-report");
  if (btn) {
    btn.disabled = !_analysed || getState().analysing;
  }
}

export { initCanvas };
