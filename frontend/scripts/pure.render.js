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
  const type = step.type || "step";
  if (type === "split") {
    return renderSplitCardHtml(step, index);
  }
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

function renderSplitCardHtml(split, index) {
  const branchesHtml = split.branches
    .map(
      (b, bi) => `
    <div class="split-branch" data-branch-id="${escapeHtml(b.id)}">
      <div class="split-branch__header">
        <span class="split-branch__label">Branch ${bi + 1}</span>
        <input class="split-branch__condition" type="text" placeholder="e.g. If customer approaches staff..." value="${escapeHtml(b.condition)}" data-branch-id="${escapeHtml(b.id)}">
        <button class="split-branch__delete" type="button" title="Remove branch" data-branch-id="${escapeHtml(b.id)}" aria-label="Remove branch">&times;</button>
      </div>
      <input class="split-branch__title" type="text" placeholder="What happens in this case..." value="${escapeHtml(b.title)}" data-branch-id="${escapeHtml(b.id)}">
      <textarea class="split-branch__desc" placeholder="Describe this branch..." data-branch-id="${escapeHtml(b.id)}">${escapeHtml(b.description)}</textarea>
      <div class="ownership-pills" role="group" aria-label="Ownership">
        <button class="ownership-pill ${b.ownership === "Human" ? "active" : ""}" data-value="Human" data-branch-id="${escapeHtml(b.id)}" type="button">Human</button>
        <button class="ownership-pill ${b.ownership === "AI" ? "active" : ""}" data-value="AI" data-branch-id="${escapeHtml(b.id)}" type="button">AI</button>
        <button class="ownership-pill ${b.ownership === "Both" ? "active" : ""}" data-value="Both" data-branch-id="${escapeHtml(b.id)}" type="button">Both</button>
      </div>
      ${b.dimensions ? renderDimensionsHtml(b.dimensions) : ""}
    </div>
  `
    )
    .join("");
  return `
    <div class="step-card__handle" draggable="true" title="Drag to reorder">&#9776;</div>
    <div class="step-card__body">
      <div class="step-card__header">
        <div class="step-card__number step-card__number--split">${index + 1}</div>
        <span class="step-card__split-label">Split flow</span>
      </div>
      <div class="split-branches">${branchesHtml}</div>
      <button class="split-add-branch" type="button" title="Add branch">+ Add branch</button>
    </div>
    <button class="step-card__delete" title="Delete split" type="button" aria-label="Delete split">&times;</button>
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

export { escapeHtml, renderStepCardHtml, renderSplitCardHtml, renderDimensionsHtml };
