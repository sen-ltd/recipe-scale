/**
 * main.js — DOM, events, rendering
 */

import { parseLine } from './parser.js';
import { scaleIngredient, formatQuantity } from './scale.js';
import { convert, toMetric, toImperial, isMetric, isImperial } from './convert.js';
import { t } from './i18n.js';

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  lang: 'en',
  theme: 'light',
  ingredients: [],   // parsed ingredients
  originalServings: 4,
  targetServings: 4,
  unitSystem: 'original', // 'original' | 'metric' | 'imperial'
  editingIndex: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScaleFactor() {
  const orig = parseFloat(state.originalServings) || 1;
  const tgt  = parseFloat(state.targetServings) || 1;
  return tgt / orig;
}

function applyUnitSystem(ingredient) {
  if (state.unitSystem === 'metric')   return toMetric(ingredient);
  if (state.unitSystem === 'imperial') return toImperial(ingredient);
  return ingredient;
}

function displayIngredient(ingredient) {
  const factor = getScaleFactor();
  const scaled  = scaleIngredient(ingredient, factor);
  const converted = applyUnitSystem(scaled);
  return converted;
}

function formatIngredientText(ingredient) {
  const parts = [];
  if (ingredient.quantity !== null) {
    parts.push(formatQuantity(ingredient.quantity));
  }
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }
  if (ingredient.name) {
    parts.push(ingredient.name);
  }
  return parts.join(' ');
}

// ─── Render ──────────────────────────────────────────────────────────────────

function render() {
  const lang = state.lang;

  // Apply theme
  document.documentElement.dataset.theme = state.theme;

  // Update language labels
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(lang, key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(lang, el.dataset.i18nPlaceholder);
  });

  // Servings
  document.getElementById('original-servings').value = state.originalServings;
  document.getElementById('target-servings').value   = state.targetServings;

  // Factor display
  const factor = getScaleFactor();
  const factorEl = document.getElementById('factor-display');
  if (factorEl) {
    factorEl.textContent = `${t(lang, 'factor')}: ×${factor.toFixed(2)}`;
  }

  // Unit system buttons
  document.querySelectorAll('[data-unit]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.unit === state.unitSystem);
    btn.textContent = t(lang, 'unit' + btn.dataset.unit.charAt(0).toUpperCase() + btn.dataset.unit.slice(1));
  });

  // Lang buttons
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });

  // Theme buttons
  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === state.theme);
    btn.textContent = t(lang, 'theme' + btn.dataset.themeVal.charAt(0).toUpperCase() + btn.dataset.themeVal.slice(1));
  });

  // Render ingredient lists
  renderIngredientLists();
}

function renderIngredientLists() {
  const lang = state.lang;
  const originalList = document.getElementById('original-list');
  const scaledList   = document.getElementById('scaled-list');

  if (!state.ingredients.length) {
    const empty = `<li class="empty-msg">${t(lang, 'noIngredients')}</li>`;
    originalList.innerHTML = empty;
    scaledList.innerHTML   = empty;
    return;
  }

  originalList.innerHTML = '';
  scaledList.innerHTML   = '';

  state.ingredients.forEach((ing, i) => {
    // Original side
    const origEl = document.createElement('li');
    origEl.className = 'ingredient-row';
    origEl.dataset.index = i;

    if (state.editingIndex === i) {
      origEl.innerHTML = renderEditForm(ing, i, lang);
    } else {
      origEl.innerHTML = `
        <span class="ing-text">${escHtml(formatIngredientText(ing))}</span>
        <button class="btn-icon btn-edit" data-index="${i}" title="${t(lang, 'editBtn')}" aria-label="${t(lang, 'editBtn')}">✏️</button>
      `;
    }
    originalList.appendChild(origEl);

    // Scaled side
    const scaledEl = document.createElement('li');
    scaledEl.className = 'ingredient-row';
    const displayed = displayIngredient(ing);

    if (ing.quantity === null) {
      scaledEl.innerHTML = `
        <span class="ing-text">${escHtml(formatIngredientText(ing))}</span>
        <span class="no-scale-note" title="${t(lang, 'unparsedNote')}">—</span>
      `;
    } else {
      scaledEl.innerHTML = `<span class="ing-text">${escHtml(formatIngredientText(displayed))}</span>`;
    }
    scaledList.appendChild(scaledEl);
  });
}

function renderEditForm(ing, index, lang) {
  return `
    <form class="edit-form" data-index="${index}">
      <input class="edit-qty"  type="text" name="qty"  value="${escAttr(ing.quantity !== null ? String(ing.quantity) : '')}" placeholder="${t(lang, 'quantityLabel')}">
      <input class="edit-unit" type="text" name="unit" value="${escAttr(ing.unit ?? '')}" placeholder="${t(lang, 'unitLabel')}">
      <input class="edit-name" type="text" name="name" value="${escAttr(ing.name)}" placeholder="${t(lang, 'nameLabel')}">
      <button type="submit" class="btn-sm btn-save">${t(lang, 'saveBtn')}</button>
      <button type="button" class="btn-sm btn-cancel" data-index="${index}">${t(lang, 'cancelBtn')}</button>
    </form>
  `;
}

// ─── Events ──────────────────────────────────────────────────────────────────

function parseIngredients() {
  const textarea = document.getElementById('ingredient-input');
  const text = textarea.value.trim();
  if (!text) return;

  state.ingredients = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => parseLine(line));

  state.editingIndex = null;
  render();
}

function clearAll() {
  document.getElementById('ingredient-input').value = '';
  state.ingredients = [];
  state.editingIndex = null;
  render();
}

function copyScaled() {
  const lines = state.ingredients.map(ing => {
    const displayed = displayIngredient(ing);
    return formatIngredientText(displayed);
  });
  const text = lines.join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    const original = btn.textContent;
    btn.textContent = t(state.lang, 'copiedMsg');
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 2000);
  });
}

function handleServingsChange(e) {
  const id = e.target.id;
  const val = parseFloat(e.target.value);
  if (isNaN(val) || val <= 0) return;
  if (id === 'original-servings') state.originalServings = val;
  if (id === 'target-servings')   state.targetServings   = val;
  renderIngredientLists();
  const factorEl = document.getElementById('factor-display');
  if (factorEl) {
    const factor = getScaleFactor();
    factorEl.textContent = `${t(state.lang, 'factor')}: ×${factor.toFixed(2)}`;
  }
}

function handleEditClick(e) {
  const btn = e.target.closest('[data-index].btn-edit, .btn-edit[data-index]');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  state.editingIndex = index;
  renderIngredientLists();
}

function handleCancelEdit(e) {
  const btn = e.target.closest('.btn-cancel');
  if (!btn) return;
  state.editingIndex = null;
  renderIngredientLists();
}

function handleEditSubmit(e) {
  const form = e.target.closest('.edit-form');
  if (!form) return;
  e.preventDefault();

  const index = parseInt(form.dataset.index, 10);
  const qtyStr = form.elements.qty.value.trim();
  const unitStr = form.elements.unit.value.trim();
  const nameStr = form.elements.name.value.trim();

  const qty = qtyStr ? (parseFloat(qtyStr) || null) : null;
  const unit = unitStr || null;

  state.ingredients[index] = {
    quantity: qty,
    unit: unit,
    name: nameStr,
    raw: formatIngredientText({ quantity: qty, unit, name: nameStr }),
  };
  state.editingIndex = null;
  renderIngredientLists();
}

// ─── Escape helpers ───────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Parse button
  document.getElementById('parse-btn').addEventListener('click', parseIngredients);
  document.getElementById('clear-btn').addEventListener('click', clearAll);
  document.getElementById('copy-btn').addEventListener('click', copyScaled);

  // Servings
  document.getElementById('original-servings').addEventListener('input', handleServingsChange);
  document.getElementById('target-servings').addEventListener('input', handleServingsChange);

  // Unit system
  document.querySelectorAll('[data-unit]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.unitSystem = btn.dataset.unit;
      renderIngredientLists();
      document.querySelectorAll('[data-unit]').forEach(b => {
        b.classList.toggle('active', b.dataset.unit === state.unitSystem);
      });
    });
  });

  // Language toggle
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      render();
    });
  });

  // Theme toggle
  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.theme = btn.dataset.themeVal;
      render();
    });
  });

  // Edit / save / cancel delegation
  const origList = document.getElementById('original-list');
  origList.addEventListener('click', (e) => {
    if (e.target.closest('.btn-edit')) handleEditClick(e);
    if (e.target.closest('.btn-cancel')) handleCancelEdit(e);
  });
  origList.addEventListener('submit', handleEditSubmit);

  // Parse on Ctrl+Enter in textarea
  document.getElementById('ingredient-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      parseIngredients();
    }
  });

  // Detect system theme
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    state.theme = 'dark';
  }

  render();
}

document.addEventListener('DOMContentLoaded', init);
