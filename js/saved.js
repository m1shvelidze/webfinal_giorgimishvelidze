/**
 * saved.js — entry point for saved.html (Favourites page)
 *
 * Demonstrates:
 *  - reading/writing application state from localStorage
 *  - dynamic card rendering
 *  - filter/search via `input` event
 *  - clear-all functionality
 *  - state held in array of objects
 */

import { loadSaved, persistSaved } from './api.js';
import { renderCards, setVisible, initMobileNav } from './ui.js';

// ── DOM refs ──────────────────────────────────────────────
const savedGrid    = document.getElementById('saved-grid');
const emptyMsg     = document.getElementById('empty-saved-msg');
const filterInput  = document.getElementById('filter-input');
const clearAllBtn  = document.getElementById('clear-all-btn');
const savedCount   = document.getElementById('saved-count');

// ── Application state ─────────────────────────────────────
/** @type {Array<Object>} All saved items (source of truth for this page) */
let savedItems = [];

// ── Init ──────────────────────────────────────────────────
initMobileNav();
loadAndRender();

// ── Event listeners ───────────────────────────────────────

// 1. Filter input
filterInput.addEventListener('input', () => {
  const q = filterInput.value.trim().toLowerCase();
  const filtered = q
    ? savedItems.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q)
      )
    : savedItems;
  renderSaved(filtered);
});

// 2. Clear all button
clearAllBtn.addEventListener('click', () => {
  if (savedItems.length === 0) return;
  if (!confirm('Remove all saved items?')) return;
  savedItems = [];
  persistSaved([]);
  renderSaved([]);
});

// 3. Keydown on filter — clear on Escape
filterInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    filterInput.value = '';
    renderSaved(savedItems);
  }
});

// ── Functions ─────────────────────────────────────────────

/** Load from localStorage then render. */
function loadAndRender() {
  savedItems = loadSaved();
  renderSaved(savedItems);
}

/**
 * Render the given items into the grid; handle empty state.
 * @param {Array<Object>} items
 */
function renderSaved(items) {
  const isEmpty = savedItems.length === 0;
  setVisible(emptyMsg, isEmpty);

  if (isEmpty) {
    savedGrid.innerHTML = '';
    savedCount.textContent = '';
    return;
  }

  savedCount.textContent = `${items.length} of ${savedItems.length} saved item${savedItems.length !== 1 ? 's' : ''}`;

  renderCards(savedGrid, items, onSaveToggle);
}

/**
 * When a card's save button is clicked on this page, remove it from state and re-render.
 * @param {Object} item
 * @param {Array} updatedSaved
 */
function onSaveToggle(item, updatedSaved) {
  savedItems = updatedSaved;
  const q = filterInput.value.trim().toLowerCase();
  const filtered = q
    ? savedItems.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.country.toLowerCase().includes(q)
      )
    : savedItems;
  renderSaved(filtered);
}