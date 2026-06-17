/**
 * api.js — TheSportsDB fetch helpers + localStorage utilities
 * Uses: https://www.thesportsdb.com/api.php (free tier, no key needed for v1)
 */

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// ── Fetch helpers ─────────────────────────────────────────

/**
 * Search for teams by name.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchTeams(query) {
  const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(query)}`;
  const data = await fetchJSON(url);
  return data.teams ?? [];
}

/**
 * Search for leagues/competitions by name.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchLeagues(query) {
  const url = `${BASE_URL}/search_all_leagues.php?c=&s=Soccer&l=${encodeURIComponent(query)}`;
  const data = await fetchJSON(url);
  return data.countrys ?? [];
}

/**
 * Get all soccer leagues for a given country.
 * @param {string} country
 * @returns {Promise<Array>}
 */
export async function getLeaguesByCountry(country) {
  const url = `${BASE_URL}/search_all_leagues.php?c=${encodeURIComponent(country)}&s=Soccer`;
  const data = await fetchJSON(url);
  return data.countrys ?? [];
}

/**
 * Get all teams in a league by league name.
 * @param {string} leagueName
 * @returns {Promise<Array>}
 */
export async function getTeamsByLeague(leagueName) {
  const url = `${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
  const data = await fetchJSON(url);
  return data.teams ?? [];
}

/**
 * Core fetch wrapper — throws on HTTP or network errors.
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ── localStorage helpers ──────────────────────────────────

const SAVED_KEY   = 'footballscout_saved';
const PROFILE_KEY = 'footballscout_profile';
const STATS_KEY   = 'footballscout_stats';

/**
 * Load saved items array from localStorage.
 * @returns {Array<Object>}
 */
export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Persist saved items array to localStorage.
 * @param {Array<Object>} items
 */
export function persistSaved(items) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(items));
}

/**
 * Toggle an item in/out of the saved list.
 * Returns the updated array.
 * @param {Object} item  — { id, name, country, badge, type, url }
 * @returns {Array<Object>}
 */
export function toggleSaved(item) {
  const saved = loadSaved();
  const idx = saved.findIndex(s => s.id === item.id);
  if (idx === -1) {
    saved.push(item);
  } else {
    saved.splice(idx, 1);
  }
  persistSaved(saved);
  return saved;
}

/**
 * Check whether an item ID is currently saved.
 * @param {string} id
 * @returns {boolean}
 */
export function isSaved(id) {
  return loadSaved().some(s => s.id === id);
}

/** Load profile object from localStorage. */
export function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) ?? null;
  } catch {
    return null;
  }
}

/** Persist profile object to localStorage. */
export function persistProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** Load stats object. */
export function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) ?? { searches: 0 };
  } catch {
    return { searches: 0 };
  }
}

/** Increment the search counter in stats. */
export function incrementSearchCount() {
  const stats = loadStats();
  stats.searches = (stats.searches ?? 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}