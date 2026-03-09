"use strict";

/**
 * Module: effect.facilitated.js
 * Type: Effect module
 * Purpose: Facilitated mode — intro overlay, guided phases, progress bar
 *
 * Depends on:
 *   - effect.state.js (getState)
 *
 * Used by: effect.canvas.js
 * Side effects: DOM reads/writes
 */

import { getState } from "./effect.state.js";

const PHASES = Object.freeze([
  {
    id: "setup",
    label: "Phase 1: Setup",
    instruction: "Start by naming the process you want to analyse. Add a description and select the context type. This sets the frame for the entire exercise.",
    tip: "Facilitator: Ask the group — 'What is the one process we should map first?'",
  },
  {
    id: "map",
    label: "Phase 2: Map Steps",
    instruction: "Break the process into individual steps. For each step, give it a clear title and a brief description. Then choose who currently owns it — Human, AI, or Both.",
    tip: "Facilitator: Go step by step. Ask — 'What happens next? Who does it?'",
  },
  {
    id: "analyse",
    label: "Phase 3: AI Analysis",
    instruction: "Click 'Analyse' to run the AI analysis. The system will evaluate each step across four dimensions: Task Allocation, Risk, Trust & Explainability, and Handoff Points.",
    tip: "Facilitator: Before clicking, ask — 'Are we confident this captures the real process?'",
  },
  {
    id: "review",
    label: "Phase 4: Review & Discuss",
    instruction: "Review the analysis results on each step card. Discuss the dimension badges with the group. Do you agree with the AI's assessment? Where do you see gaps?",
    tip: "Facilitator: Walk through each step. Ask — 'Does this feel right? What would you change?'",
  },
  {
    id: "report",
    label: "Phase 5: Generate Report",
    instruction: "Click 'Generate Report' to create a professional summary. You can then export it as PDF to share with stakeholders.",
    tip: "Facilitator: This is your deliverable. Review it together before exporting.",
  },
]);

let _currentPhase = 0;

function initFacilitated() {
  _injectIntroOverlay();
  _injectProgressBar();
  _injectGuidePanel();
  _setPhase(0);

  document.addEventListener("app:state-changed", _syncPhaseFromState);
}

function _injectIntroOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "facilitated-intro";
  overlay.className = "facilitated-intro";
  overlay.innerHTML = `
    <div class="facilitated-intro__card">
      <div class="facilitated-intro__icon" aria-hidden="true">&#9881;</div>
      <h2 class="facilitated-intro__title">Welcome to the Facilitated Workshop</h2>
      <p class="facilitated-intro__body">
        This guided mode walks your team through mapping the <strong>division of labour between humans and AI</strong>.
        You'll define process steps, assign ownership, run AI analysis, and generate a professional report.<br><br>
        The facilitator guides discussion at each phase. The AI handles the analytical heavy lifting.
      </p>
      <button id="btn-start-facilitated" class="btn btn-accent btn-lg" type="button">Begin Workshop</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("btn-start-facilitated").addEventListener("click", () => {
    overlay.hidden = true;
    _setPhase(0);
  });
}

function _injectProgressBar() {
  const bar = document.createElement("div");
  bar.id = "facilitated-progress";
  bar.className = "facilitated-progress";
  bar.hidden = true;
  bar.innerHTML = `
    <span id="progress-label" class="facilitated-progress__label"></span>
    <div class="facilitated-progress__track">
      <div id="progress-fill" class="facilitated-progress__fill"></div>
    </div>
  `;

  const siteMain = document.querySelector(".site-main");
  if (siteMain) {
    siteMain.parentNode.insertBefore(bar, siteMain);
  }
}

function _injectGuidePanel() {
  const panel = document.createElement("div");
  panel.id = "facilitated-guide";
  panel.className = "facilitated-guide";
  panel.hidden = true;
  panel.innerHTML = `
    <div id="guide-phase" class="facilitated-guide__phase"></div>
    <div id="guide-instruction" class="facilitated-guide__instruction"></div>
    <div id="guide-tip" class="facilitated-guide__tip"></div>
  `;

  const canvasMain = document.querySelector(".canvas-main");
  if (canvasMain) {
    canvasMain.insertBefore(panel, canvasMain.firstChild);
  }
}

function _setPhase(index) {
  _currentPhase = Math.max(0, Math.min(index, PHASES.length - 1));
  const phase = PHASES[_currentPhase];

  const progressBar = document.getElementById("facilitated-progress");
  const progressLabel = document.getElementById("progress-label");
  const progressFill = document.getElementById("progress-fill");
  const guide = document.getElementById("facilitated-guide");
  const guidePhase = document.getElementById("guide-phase");
  const guideInstruction = document.getElementById("guide-instruction");
  const guideTip = document.getElementById("guide-tip");

  if (progressBar) {
    progressBar.hidden = false;
  }
  if (progressLabel) {
    progressLabel.textContent = `Phase ${_currentPhase + 1} of ${PHASES.length}`;
  }
  if (progressFill) {
    const pct = ((_currentPhase + 1) / PHASES.length) * 100;
    progressFill.style.width = `${pct}%`;
  }

  if (guide) guide.hidden = false;
  if (guidePhase) guidePhase.textContent = phase.label;
  if (guideInstruction) guideInstruction.textContent = phase.instruction;
  if (guideTip) guideTip.textContent = phase.tip;
}

function _syncPhaseFromState() {
  const state = getState();
  const hasName = state.process_name.trim().length > 0;
  const hasSteps = state.steps.length > 0;
  const hasAnalysis = state.steps.some((s) => s.dimensions !== null);

  if (!hasName && !hasSteps) {
    _setPhase(0);
  } else if (hasName && !hasSteps) {
    _setPhase(1);
  } else if (hasSteps && !hasAnalysis && !state.analysing) {
    _setPhase(1);
  } else if (state.analysing) {
    _setPhase(2);
  } else if (hasAnalysis) {
    _setPhase(3);
  }
}

function advanceToReport() {
  _setPhase(4);
}

export { initFacilitated, advanceToReport };
