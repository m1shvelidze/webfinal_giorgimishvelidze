/**
 * ui.js — Shared DOM rendering helpers
 */

import { toggleSaved, isSaved } from './api.js';

// ── Card rendering ────────────────────────────────────────

/**
 * Build and return a card DOM element for a team or league item.
 * Demonstrates: createElement, appendChild, closure over `item`.
 *
 * The save button handler closes over the `item` object from each
 * iteration, so each card independently knows which item it represents.
 *
 * @param {Object} item  — normalised card data
 * @param {Function} [onSaveToggle]  — callback(item, saved[])
 * @returns {HTMLElement}
 */
export function createCard(item, onSaveToggle = null) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = item.id;

  // Badge (team / league)
  const badge = document.createElement('span');
  badge.className = 'card__badge';
  badge.textContent = item.type === 'league' ? '🏆 League' : '⚽ Team';

  // Image area
  const imgWrap = document.createElement('div');
  imgWrap.className = 'card__img-wrap';

  if (item.badge) {
    const img = document.createElement('img');
    img.className = 'card__img';
    img.src = item.badge;
    img.alt = `${item.name} badge`;
    img.loading = 'lazy';
    img.onerror = () => {
      imgWrap.innerHTML = `<span class="card__img-placeholder">${item.type === 'league' ? '🏆' : '⚽'}</span>`;
    };
    imgWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'card__img-placeholder';
    placeholder.textContent = item.type === 'league' ? '🏆' : '⚽';
    imgWrap.appendChild(placeholder);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'card__body';

  const name = document.createElement('h3');
  name.className = 'card__name';
  name.textContent = item.name;

  const meta = document.createElement('p');
  meta.className = 'card__meta';
  meta.textContent = [item.country, item.sport].filter(Boolean).join(' · ');

  body.appendChild(name);
  body.appendChild(meta);

  // Footer: save button + optional link
  const footer = document.createElement('div');
  footer.className = 'card__footer';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'card__save-btn';
  saveBtn.setAttribute('aria-label', isSaved(item.id) ? 'Remove from favourites' : 'Save to favourites');
  saveBtn.textContent = isSaved(item.id) ? '★' : '☆';
  if (isSaved(item.id)) saveBtn.classList.add('card__save-btn--saved');

  // Closure: the handler closes over `item` from this specific iteration
  saveBtn.addEventListener('click', () => {
    const updated = toggleSaved(item);
    const nowSaved = isSaved(item.id);
    saveBtn.textContent = nowSaved ? '★' : '☆';
    saveBtn.setAttribute('aria-label', nowSaved ? 'Remove from favourites' : 'Save to favourites');
    saveBtn.classList.toggle('card__save-btn--saved', nowSaved);
    if (onSaveToggle) onSaveToggle(item, updated);
  });

  footer.appendChild(saveBtn);

  if (item.url) {
    const link = document.createElement('a');
    link.className = 'card__link';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Details ↗';
    footer.appendChild(link);
  }

  // Assemble card
  card.appendChild(badge);
  card.appendChild(imgWrap);
  card.appendChild(body);
  card.appendChild(footer);

  return card;
}

/**
 * Render an array of normalised items into a grid container.
 * @param {HTMLElement} container
 * @param {Array<Object>} items
 * @param {Function} [onSaveToggle]
 */
export function renderCards(container, items, onSaveToggle = null) {
  container.innerHTML = '';
  items.forEach(item => {
    const card = createCard(item, onSaveToggle);
    container.appendChild(card);
  });
}

// ── Data normalisation ────────────────────────────────────

/**
 * Normalise a TheSportsDB team object into a flat card item.
 * @param {Object} team
 * @returns {Object}
 */
export function normaliseTeam(team) {
  return {
    id:      'team_' + team.idTeam,
    name:    team.strTeam,
    country: team.strCountry ?? '',
    sport:   team.strSport ?? 'Soccer',
    badge:   team.strTeamBadge ?? null,
    type:    'team',
    url:     team.strWebsite
      ? (team.strWebsite.startsWith('http') ? team.strWebsite : 'https://' + team.strWebsite)
      : null,
  };
}

/**
 * Normalise a TheSportsDB league/country entry into a flat card item.
 * @param {Object} league
 * @returns {Object}
 */
export function normaliseLeague(league) {
  return {
    id:      'league_' + (league.idLeague ?? league.strLeague?.replace(/\s/g, '_')),
    name:    league.strLeague ?? league.name,
    country: league.strCountry ?? '',
    sport:   'Soccer',
    badge:   league.strBadge ?? league.strLogo ?? null,
    type:    'league',
    url:     null,
  };
}

// ── Shared UI utilities ───────────────────────────────────

/**
 * Show/hide an element with the `hidden` attribute.
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
export function setVisible(el, visible) {
  el.hidden = !visible;
}

/**
 * Mobile hamburger nav toggle (shared across pages).
 */
export function initMobileNav() {
  const btn   = document.getElementById('hamburger-btn');
  const links = document.querySelector('.nav__links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    links.classList.toggle('nav__links--open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('nav__links--open');
    }
  });
}