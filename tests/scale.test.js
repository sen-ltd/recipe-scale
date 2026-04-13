import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scaleIngredient, formatQuantity, toFraction } from '../src/scale.js';
import { convert, toMetric, toImperial, isImperial, isMetric } from '../src/convert.js';

// ─── formatQuantity ──────────────────────────────────────────────────────────

test('formatQuantity: integer', () => {
  assert.equal(formatQuantity(2), '2');
  assert.equal(formatQuantity(1), '1');
});

test('formatQuantity: ½', () => {
  assert.equal(formatQuantity(0.5), '½');
});

test('formatQuantity: ¼', () => {
  assert.equal(formatQuantity(0.25), '¼');
});

test('formatQuantity: ¾', () => {
  assert.equal(formatQuantity(0.75), '¾');
});

test('formatQuantity: ⅓', () => {
  assert.equal(formatQuantity(1/3), '⅓');
});

test('formatQuantity: ⅔', () => {
  assert.equal(formatQuantity(2/3), '⅔');
});

test('formatQuantity: mixed 1½', () => {
  assert.equal(formatQuantity(1.5), '1½');
});

test('formatQuantity: mixed 2¼', () => {
  assert.equal(formatQuantity(2.25), '2¼');
});

test('formatQuantity: whole 2.0', () => {
  assert.equal(formatQuantity(2.0), '2');
});

test('formatQuantity: 0 returns "0"', () => {
  assert.equal(formatQuantity(0), '0');
});

// ─── toFraction ──────────────────────────────────────────────────────────────

test('toFraction: 0.5 → 1/2', () => {
  const { numerator, denominator } = toFraction(0.5);
  assert.equal(numerator, 1);
  assert.equal(denominator, 2);
});

test('toFraction: 0.25 → 1/4', () => {
  const { numerator, denominator } = toFraction(0.25);
  assert.equal(numerator, 1);
  assert.equal(denominator, 4);
});

test('toFraction: 0.75 → 3/4', () => {
  const { numerator, denominator } = toFraction(0.75);
  assert.equal(numerator, 3);
  assert.equal(denominator, 4);
});

test('toFraction: 0 → 0/1', () => {
  const { numerator, denominator } = toFraction(0);
  assert.equal(numerator, 0);
  assert.equal(denominator, 1);
});

// ─── scaleIngredient ─────────────────────────────────────────────────────────

test('scaleIngredient: doubles quantity', () => {
  const ing = { quantity: 2, unit: 'cup', name: 'flour', raw: '2 cup flour' };
  const scaled = scaleIngredient(ing, 2);
  assert.equal(scaled.quantity, 4);
  assert.equal(scaled.unit, 'cup');
  assert.equal(scaled.name, 'flour');
});

test('scaleIngredient: halves quantity', () => {
  const ing = { quantity: 1, unit: 'tbsp', name: 'sugar', raw: '1 tbsp sugar' };
  const scaled = scaleIngredient(ing, 0.5);
  assert.equal(scaled.quantity, 0.5);
});

test('scaleIngredient: null quantity unchanged', () => {
  const ing = { quantity: null, unit: null, name: 'salt to taste', raw: 'salt to taste' };
  const scaled = scaleIngredient(ing, 3);
  assert.equal(scaled.quantity, null);
});

test('scaleIngredient: factor 1 is no-op', () => {
  const ing = { quantity: 2.5, unit: 'g', name: 'yeast', raw: '2.5 g yeast' };
  const scaled = scaleIngredient(ing, 1);
  assert.equal(scaled.quantity, 2.5);
});

// ─── convert ─────────────────────────────────────────────────────────────────

test('convert: cup to ml', () => {
  assert.equal(convert(1, 'cup', 'ml'), 240);
});

test('convert: tbsp to ml', () => {
  assert.equal(convert(1, 'tbsp', 'ml'), 15);
});

test('convert: tsp to ml', () => {
  assert.equal(convert(1, 'tsp', 'ml'), 5);
});

test('convert: oz to g', () => {
  assert.ok(Math.abs(convert(1, 'oz', 'g') - 28.3495) < 0.001);
});

test('convert: lb to g', () => {
  assert.ok(Math.abs(convert(1, 'lb', 'g') - 453.592) < 0.001);
});

test('convert: ml to cup', () => {
  assert.ok(Math.abs(convert(240, 'ml', 'cup') - 1) < 0.001);
});

test('convert: same unit returns value', () => {
  assert.equal(convert(5, 'tsp', 'tsp'), 5);
});

test('convert: incompatible units returns null', () => {
  assert.equal(convert(1, 'cup', 'g'), null);
});

test('convert: unknown unit returns null', () => {
  assert.equal(convert(1, 'furlong', 'ml'), null);
});

test('convert: 大さじ to ml (15ml)', () => {
  assert.equal(convert(1, '大さじ', 'ml'), 15);
});

test('convert: 小さじ to ml (5ml)', () => {
  assert.equal(convert(1, '小さじ', 'ml'), 5);
});

// ─── isImperial / isMetric ───────────────────────────────────────────────────

test('isImperial: cup is imperial', () => {
  assert.equal(isImperial('cup'), true);
});

test('isImperial: ml is not imperial', () => {
  assert.equal(isImperial('ml'), false);
});

test('isMetric: g is metric', () => {
  assert.equal(isMetric('g'), true);
});

test('isMetric: oz is not metric', () => {
  assert.equal(isMetric('oz'), false);
});

// ─── toMetric / toImperial ───────────────────────────────────────────────────

test('toMetric: cup → ml', () => {
  const ing = { quantity: 1, unit: 'cup', name: 'flour', raw: '' };
  const r = toMetric(ing);
  assert.equal(r.unit, 'ml');
  assert.equal(r.quantity, 240);
});

test('toMetric: already metric passes through', () => {
  const ing = { quantity: 100, unit: 'g', name: 'sugar', raw: '' };
  const r = toMetric(ing);
  assert.equal(r.unit, 'g');
  assert.equal(r.quantity, 100);
});

test('toImperial: ml → tsp (5ml)', () => {
  const ing = { quantity: 5, unit: 'ml', name: 'oil', raw: '' };
  const r = toImperial(ing);
  assert.equal(r.unit, 'tsp');
  assert.ok(Math.abs(r.quantity - 1) < 0.001);
});

test('toMetric: oz → g', () => {
  const ing = { quantity: 2, unit: 'oz', name: 'butter', raw: '' };
  const r = toMetric(ing);
  assert.equal(r.unit, 'g');
  assert.ok(Math.abs(r.quantity - 56.699) < 0.01);
});

test('round trip: cup → ml → cup', () => {
  const ml = convert(2, 'cup', 'ml');
  const back = convert(ml, 'ml', 'cup');
  assert.ok(Math.abs(back - 2) < 0.001);
});
