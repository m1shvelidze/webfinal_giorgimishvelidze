/**
 * login.js — entry point for login.html (Profile page)
 *
 * Demonstrates:
 *  - form handling with e.preventDefault()
 *  - client-side validation + visible feedback
 *  - localStorage read/write (profile + stats)
 *  - textarea char counter (input event)
 *  - session counter using a closure
 *  - 3+ event types: submit, input, click, keydown
 */

import {
  loadProfile,
  persistProfile,
  loadSaved,
  loadStats,
} from './api.js';

import { initMobileNav } from './ui.js';

// ── DOM refs ──────────────────────────────────────────────
const form              = document.getElementById('profile-form');
const displayNameInput  = document.getElementById('display-name');
const emailInput        = document.getElementById('email');
const favLeagueSelect   = document.getElementById('fav-league');
const bioTextarea       = document.getElementById('bio');
const bioCount          = document.getElementById('bio-count');
const formFeedback      = document.getElementById('form-feedback');
const resetBtn          = document.getElementById('reset-profile-btn');

const profileNameDisplay = document.getElementById('profile-name-display');
const profileMeta        = document.getElementById('profile-meta');

const statSaved   = document.getElementById('stat-saved');
const statSearches = document.getElementById('stat-searches');
const statSession = document.getElementById('stat-session');

// ── Session counter (closure) ─────────────────────────────
/**
 * Creates a private session counter.
 * The `count` variable lives in the closure scope — no other
 * module can accidentally modify it. We expose only increment + get.
 */
const sessionCounter = (() => {
  let count = 0;
  return {
    increment: () => ++count,
    get: () => count,
  };
})();

// ── Init ──────────────────────────────────────────────────
initMobileNav();
loadProfileIntoForm();
updateStats();

// ── Event listeners ───────────────────────────────────────

// 1. Form submit
form.addEventListener('submit', handleSave);

// 2. Textarea char counter (input event)
bioTextarea.addEventListener('input', () => {
  bioCount.textContent = `${bioTextarea.value.length} / 200`;
});

// 3. Reset button (click)
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset your profile? This cannot be undone.')) return;
  localStorage.removeItem('footballscout_profile');
  form.reset();
  bioCount.textContent = '0 / 200';
  profileNameDisplay.textContent = 'Guest';
  profileMeta.textContent = 'Not set up yet';
  showFeedback('Profile reset.', 'error');
});

// 4. Keydown — prevent accidental Enter-submit on text fields
displayNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') e.preventDefault();
});

// 5. Input on name field — live preview
displayNameInput.addEventListener('input', () => {
  if (displayNameInput.value.trim()) {
    profileNameDisplay.textContent = displayNameInput.value.trim();
  }
});

// ── Functions ─────────────────────────────────────────────

/**
 * Handle form submission: validate, save to localStorage, show feedback.
 * @param {Event} e
 */
function handleSave(e) {
  e.preventDefault();

  const name = displayNameInput.value.trim();
  if (!validateProfile(name)) return;

  const profile = buildProfileObject();
  persistProfile(profile);

  // Track session saves
  sessionCounter.increment();
  statSession.textContent = sessionCounter.get();

  // Update the sidebar preview
  updateProfileDisplay(profile);

  showFeedback('✓ Profile saved successfully!', 'success');
}

/**
 * Validate the profile form; show inline errors if needed.
 * @param {string} name
 * @returns {boolean}
 */
function validateProfile(name) {
  if (name.length < 2) {
    showFeedback('Display name must be at least 2 characters.', 'error');
    displayNameInput.focus();
    return false;
  }
  const email = emailInput.value.trim();
  if (email && !isValidEmail(email)) {
    showFeedback('Please enter a valid email address.', 'error');
    emailInput.focus();
    return false;
  }
  return true;
}

/**
 * Simple email format check.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Build a profile object from the current form values.
 * @returns {Object}
 */
function buildProfileObject() {
  return {
    name:      displayNameInput.value.trim(),
    email:     emailInput.value.trim(),
    favLeague: favLeagueSelect.value,
    bio:       bioTextarea.value.trim(),
    notifs: {
      results:   document.getElementById('notif-results').checked,
      transfers: document.getElementById('notif-transfers').checked,
      newFeatures: document.getElementById('notif-new').checked,
    },
  };
}

/** Pre-fill the form with a previously saved profile. */
function loadProfileIntoForm() {
  const profile = loadProfile();
  if (!profile) return;

  displayNameInput.value  = profile.name ?? '';
  emailInput.value        = profile.email ?? '';
  favLeagueSelect.value   = profile.favLeague ?? '';
  bioTextarea.value       = profile.bio ?? '';
  bioCount.textContent    = `${bioTextarea.value.length} / 200`;

  if (profile.notifs) {
    document.getElementById('notif-results').checked   = profile.notifs.results ?? false;
    document.getElementById('notif-transfers').checked = profile.notifs.transfers ?? false;
    document.getElementById('notif-new').checked       = profile.notifs.newFeatures ?? false;
  }

  updateProfileDisplay(profile);
}

/**
 * Update the sidebar preview card.
 * @param {Object} profile
 */
function updateProfileDisplay(profile) {
  profileNameDisplay.textContent = profile.name || 'Guest';
  profileMeta.textContent = [
    profile.favLeague || null,
    profile.email || null,
  ].filter(Boolean).join(' · ') || 'Not set up yet';
}

/** Update the stats panel from localStorage. */
function updateStats() {
  const saved   = loadSaved();
  const stats   = loadStats();
  statSaved.textContent    = saved.length;
  statSearches.textContent = stats.searches ?? 0;
  statSession.textContent  = sessionCounter.get();
}

/**
 * Show a feedback message below the form.
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showFeedback(message, type) {
  formFeedback.textContent = message;
  formFeedback.className = `profile-form__feedback profile-form__feedback--${type}`;
  formFeedback.hidden = false;

  // Auto-hide success after 3 seconds
  if (type === 'success') {
    setTimeout(() => { formFeedback.hidden = true; }, 3000);
  }
}