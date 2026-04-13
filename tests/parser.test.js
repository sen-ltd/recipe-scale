import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseLine, parseQuantity, KNOWN_UNITS } from '../src/parser.js';

// ─── parseQuantity ────────────────────────────────────────────────────────────

test('parseQuantity: integer', () => {
  assert.equal(parseQuantity('3'), 3);
});

test('parseQuantity: decimal', () => {
  assert.equal(parseQuantity('2.5'), 2.5);
});

test('parseQuantity: simple fraction 1/2', () => {
  assert.equal(parseQuantity('1/2'), 0.5);
});

test('parseQuantity: simple fraction 3/4', () => {
  assert.equal(parseQuantity('3/4'), 0.75);
});

test('parseQuantity: mixed number "1 1/2"', () => {
  assert.equal(parseQuantity('1 1/2'), 1.5);
});

test('parseQuantity: mixed number "2 1/4"', () => {
  assert.equal(parseQuantity('2 1/4'), 2.25);
});

test('parseQuantity: unicode fraction ½', () => {
  assert.equal(parseQuantity('½'), 0.5);
});

test('parseQuantity: unicode fraction ¼', () => {
  assert.equal(parseQuantity('¼'), 0.25);
});

test('parseQuantity: unicode fraction ⅓', () => {
  assert.ok(Math.abs(parseQuantity('⅓') - 1/3) < 0.001);
});

test('parseQuantity: mixed with unicode "1½"', () => {
  assert.equal(parseQuantity('1½'), 1.5);
});

test('parseQuantity: null on empty string', () => {
  assert.equal(parseQuantity(''), null);
});

test('parseQuantity: null on non-numeric', () => {
  assert.equal(parseQuantity('abc'), null);
});

// ─── parseLine ────────────────────────────────────────────────────────────────

test('parseLine: "1 1/2 cups flour"', () => {
  const r = parseLine('1 1/2 cups flour');
  assert.equal(r.quantity, 1.5);
  assert.equal(r.unit, 'cup');
  assert.equal(r.name, 'flour');
});

test('parseLine: "200g sugar"', () => {
  const r = parseLine('200g sugar');
  assert.equal(r.quantity, 200);
  assert.equal(r.unit, 'g');
  assert.equal(r.name, 'sugar');
});

test('parseLine: "2 tbsp olive oil"', () => {
  const r = parseLine('2 tbsp olive oil');
  assert.equal(r.quantity, 2);
  assert.equal(r.unit, 'tbsp');
  assert.equal(r.name, 'olive oil');
});

test('parseLine: "1 tsp salt"', () => {
  const r = parseLine('1 tsp salt');
  assert.equal(r.quantity, 1);
  assert.equal(r.unit, 'tsp');
  assert.equal(r.name, 'salt');
});

test('parseLine: "salt to taste" → no quantity', () => {
  const r = parseLine('salt to taste');
  assert.equal(r.quantity, null);
  assert.equal(r.unit, null);
  assert.equal(r.name, 'salt to taste');
});

test('parseLine: "a pinch of cinnamon" → no quantity', () => {
  const r = parseLine('a pinch of cinnamon');
  assert.equal(r.quantity, null);
});

test('parseLine: Japanese "大さじ 2 の醤油"', () => {
  const r = parseLine('大さじ 2 の醤油');
  assert.equal(r.quantity, 2);
  assert.equal(r.unit, '大さじ');
  assert.equal(r.name, '醤油');
});

test('parseLine: Japanese "卵 3 個"', () => {
  const r = parseLine('卵 3 個');
  assert.equal(r.quantity, 3);
  assert.equal(r.unit, '個');
  assert.equal(r.name, '卵');
});

test('parseLine: Japanese "にんじん 2本"', () => {
  const r = parseLine('にんじん 2本');
  assert.equal(r.quantity, 2);
  assert.equal(r.unit, '本');
  assert.equal(r.name, 'にんじん');
});

test('parseLine: "3 eggs" (count, no unit)', () => {
  const r = parseLine('3 eggs');
  assert.equal(r.quantity, 3);
  assert.equal(r.unit, null);
  assert.equal(r.name, 'eggs');
});

test('parseLine: fraction "1/2 cup butter"', () => {
  const r = parseLine('1/2 cup butter');
  assert.equal(r.quantity, 0.5);
  assert.equal(r.unit, 'cup');
  assert.equal(r.name, 'butter');
});

test('parseLine: raw is preserved', () => {
  const line = '2 tbsp olive oil';
  const r = parseLine(line);
  assert.equal(r.raw, line);
});

test('KNOWN_UNITS contains cup', () => {
  const cups = KNOWN_UNITS.find(u => u.canonical === 'cup');
  assert.ok(cups);
  assert.ok(cups.aliases.includes('cup'));
  assert.ok(cups.aliases.includes('cups'));
});

test('parseLine: "2.5 kg potatoes"', () => {
  const r = parseLine('2.5 kg potatoes');
  assert.equal(r.quantity, 2.5);
  assert.equal(r.unit, 'kg');
  assert.equal(r.name, 'potatoes');
});

test('parseLine: empty line returns empty name', () => {
  const r = parseLine('');
  assert.equal(r.name, '');
  assert.equal(r.quantity, null);
});
