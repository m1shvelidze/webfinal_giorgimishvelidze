/**
 * main.js — entry point for index.html (Search page)
 *
 * Demonstrates:
 *  - fetch() with async/await
 *  - loading + error states
 *  - form handling with e.preventDefault()
 *  - client-side validation
 *  - dynamic DOM creation via ui.js
 *  - 3+ event types: submit, input, change, click, keydown
 *  - debounce closure
 *  - application state in array of objects (results[])
 *  - localStorage via api.js helpers
 */

import {
  searchTeams,
  searchLeagues,
  getLeaguesByCountry,
  getTeamsByLeague,
  incrementSearchCount,
} from './api.js';

import {
  renderCards,
  normaliseTeam,
  normaliseLeague,
  setVisible,
  initMobileNav,
} from './ui.js';

// ── DOM refs ──────────────────────────────────────────────
const form          = document.getElementById('search-form');
const searchInput   = document.getElementById('search-input');
const countrySelect = document.getElementById('country-select');
const loadingMsg    = document.getElementById('loading-msg');
const errorMsg      = document.getElementById('error-msg');
const emptyMsg      = document.getElementById('empty-msg');
const resultsSection = document.getElementById('results-section');
const resultsGrid   = document.getElementById('results-grid');
const resultsTitle  = document.getElementById('results-title');
const formError     = document.getElementById('form-error');

// ── Application state ─────────────────────────────────────
/** @type {Array<Object>} Current search result items */
let results = [];

// ── Init ──────────────────────────────────────────────────
initMobileNav();

// ── Event listeners ───────────────────────────────────────

// 1. Form submit
form.addEventListener('submit', handleSearch);

// 2. Input event — live validation feedback
searchInput.addEventListener('input', () => {
  setVisible(formError, false);
});

// 3. Country select change — browse by country if no query, re-filter if query exists
countrySelect.addEventListener('change', () => {
  const country = countrySelect.value;
  const query   = searchInput.value.trim();

  if (country && query.length < 2) {
    // No search query — browse this country's teams/leagues directly
    browseByCountry(country);
  } else if (query.length >= 2) {
    // Query exists — re-run search with the new country filter
    performSearch(query);
  } else {
    // Nothing selected and no query — reset
    clearResults();
  }
});

// 3b. Search-type radio change — re-run current mode if something is already showing
document.querySelectorAll('input[name="search-type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const country = countrySelect.value;
    const query   = searchInput.value.trim();
    if (country && query.length < 2) {
      browseByCountry(country);
    } else if (query.length >= 2) {
      performSearch(query);
    }
  });
});

// 4. Keydown on input — clear on Escape
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    clearResults();
  }
});

// 5. Clear button (reset event on form)
form.addEventListener('reset', () => {
  setTimeout(clearResults, 0); // wait for browser to reset values
  setVisible(formError, false);
});

// ── Debounce closure ──────────────────────────────────────
/**
 * Returns a debounced version of `fn`.
 * Classic closure: `timer` lives in the closure scope, private to this wrapper.
 * Natural fit here: we don't want an API call on every keystroke.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Attach debounced live-search (fires 500ms after user stops typing)
const debouncedSearch = debounce(async () => {
  const q = searchInput.value.trim();
  if (q.length >= 3) {
    await performSearch(q);
  }
}, 500);

searchInput.addEventListener('input', debouncedSearch);

// ── Core functions ────────────────────────────────────────

/**
 * Handle form submit: validate then run search.
 * @param {Event} e
 */
async function handleSearch(e) {
  e.preventDefault();

  const query = searchInput.value.trim();
  if (!validateQuery(query)) return;

  await performSearch(query);
}

/**
 * Client-side validation — shows inline feedback.
 * @param {string} query
 * @returns {boolean}
 */
function validateQuery(query) {
  if (query.length < 2) {
    setVisible(formError, true);
    searchInput.focus();
    return false;
  }
  setVisible(formError, false);
  return true;
}

/**
 * Run a search: show loading, fetch, render.
 * @param {string} query
 */
async function performSearch(query) {
  const searchType = getSelectedSearchType();

  showLoading(true);
  hideMessages();

  try {
    let raw = [];

    if (searchType === 'teams') {
      raw = await searchTeams(query);
    } else {
      raw = await searchLeagues(query);
    }

    // Normalise — filter to Soccer only (API returns all sports)
    results = searchType === 'teams'
      ? raw.filter(t => t.strSport === 'Soccer').map(normaliseTeam)
      : raw.map(normaliseLeague);

    // Filter by country if selected
    const country = countrySelect.value;
    if (country) {
      results = results.filter(r =>
        r.country.toLowerCase() === country.toLowerCase()
      );
    }

    // Track search count in localStorage
    incrementSearchCount();

    renderResults(query, results);
  } catch (err) {
    showError(`Failed to fetch results: ${err.message}. Check your connection and try again.`);
  } finally {
    showLoading(false);
  }
}

/**
 * Browse teams or leagues for a country without a search query.
 * For teams: fetches soccer leagues in the country, then loads the first league's teams.
 * For leagues: fetches all soccer leagues in the country directly.
 * @param {string} country
 */
async function browseByCountry(country) {
  const searchType = getSelectedSearchType();

  showLoading(true);
  hideMessages();

  try {
    if (searchType === 'leagues') {
      const raw = await getLeaguesByCountry(country);
      results = raw.map(normaliseLeague);
      renderResults(`${country} leagues`, results);
    } else {
      // Step 1: get soccer leagues for this country
      const leagues = await getLeaguesByCountry(country);

      if (leagues.length === 0) {
        results = [];
        renderResults(country, results);
        return;
      }

      // Step 2: load teams from the first (most prominent) league found
      const mainLeague = leagues[0].strLeague;
      const raw = await getTeamsByLeague(mainLeague);
      results = raw
        .filter(t => t.strSport === 'Soccer')
        .map(normaliseTeam);

      renderResults(`${mainLeague} teams`, results);
    }

    incrementSearchCount();
  } catch (err) {
    showError(`Could not load ${country}: ${err.message}. Check your connection and try again.`);
  } finally {
    showLoading(false);
  }
}

/**
 * Render results into the grid; handle empty state.
 * @param {string} label  — display label for the results heading
 * @param {Array<Object>} items
 */
function renderResults(label, items) {
  if (items.length === 0) {
    setVisible(emptyMsg, true);
    setVisible(resultsSection, false);
    return;
  }

  resultsTitle.textContent = `${items.length} result${items.length !== 1 ? 's' : ''} for "${label}"`;
  setVisible(resultsSection, true);

  renderCards(resultsGrid, items, onSaveToggle);
}

/**
 * Called when any card's save button is clicked.
 * @param {Object} item
 * @param {Array} updatedSaved
 */
function onSaveToggle(item, updatedSaved) {
  // Optionally could show a toast; for now just a console record
  console.info(`Saved list updated (${updatedSaved.length} items)`);
}

/**
 * Get the currently selected search type radio value.
 * @returns {'teams'|'leagues'}
 */
function getSelectedSearchType() {
  return document.querySelector('input[name="search-type"]:checked')?.value ?? 'teams';
}

/** Clear results area back to initial state. */
function clearResults() {
  results = [];
  resultsGrid.innerHTML = '';
  setVisible(resultsSection, false);
  setVisible(emptyMsg, false);
  setVisible(errorMsg, false);
}

/** Show or hide the loading spinner. */
function showLoading(visible) {
  setVisible(loadingMsg, visible);
}

/** Show an error message to the user. */
function showError(message) {
  errorMsg.textContent = message;
  setVisible(errorMsg, true);
}

/** Hide all status messages. */
function hideMessages() {
  setVisible(errorMsg, false);
  setVisible(emptyMsg, false);
}