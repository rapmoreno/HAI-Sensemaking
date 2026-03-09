"use strict";

/**
 * Module: pure.render.js
 * Type: Pure module
 * Purpose: Pure rendering helpers — HTML escaping, template generation
 *
 * Depends on: Nothing
 * Used by: effect.canvas.js
 * Side effects: None
 */

function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

function renderStepCardHtml(step, index) {
  return `
    <div class="step-card__handle" draggable="true" title="Drag to reorder">&#9776;</div>
    <div class="step-card__body">
      <div class="step-card__header">
        <div class="step-card__number">${index + 1}</div>
        <input class="step-card__title-input" type="text" placeholder="Step title..." value="${escapeHtml(step.title)}" aria-label="Step ${index + 1} title">
      </div>
      <textarea class="step-card__desc-input" placeholder="Describe this step..." aria-label="Step ${index + 1} description">${escapeHtml(step.description)}</textarea>
      <div class="ownership-pills" role="group" aria-label="Ownership">
        <button class="ownership-pill ${step.ownership === "Human" ? "active" : ""}" data-value="Human" type="button">Human</button>
        <button class="ownership-pill ${step.ownership === "AI" ? "active" : ""}" data-value="AI" type="button">AI</button>
        <button class="ownership-pill ${step.ownership === "Both" ? "active" : ""}" data-value="Both" type="button">Both</button>
      </div>
      ${step.dimensions ? renderDimensionsHtml(step.dimensions) : ""}
    </div>
    <button class="step-card__delete" title="Delete step" type="button" aria-label="Delete step">&times;</button>
  `;
}

function renderDimensionsHtml(dims) {
  if (!dims) return "";
  let html = '<div class="step-card__dimensions">';
  for (const [key, val] of Object.entries(dims)) {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    html += `
      <div class="dimension-row">
        <span class="dimension-label">${escapeHtml(label)}</span>
        <span class="dimension-badge dimension-badge--${escapeHtml(val.value)}">${escapeHtml(val.value)}</span>
        <span class="dimension-rationale">${escapeHtml(val.rationale)}</span>
      </div>`;
  }
  html += "</div>";
  return html;
}

export { escapeHtml, renderStepCardHtml, renderDimensionsHtml };
