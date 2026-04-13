/**
 * convert.js — Unit conversion utilities
 * All conversions go through a base unit (ml for volume, g for weight).
 */

// Base units: volume → ml, weight → g
const TO_BASE = {
  // Volume (→ ml)
  'cup':   240,
  'tbsp':  15,
  'tsp':   5,
  'fl oz': 29.5735,
  'pt':    473.176,
  'qt':    946.353,
  'gal':   3785.41,
  'ml':    1,
  'l':     1000,
  // Japanese volume (→ ml)
  '大さじ': 15,
  '小さじ': 5,
  '杯':     180, // 1 杯 = 1 合 = 180ml (rice cup)
  // Weight (→ g)
  'oz':    28.3495,
  'lb':    453.592,
  'g':     1,
  'kg':    1000,
};

// Unit type lookup
const UNIT_TYPE = {};
const VOLUME_UNITS = new Set(['cup', 'tbsp', 'tsp', 'fl oz', 'pt', 'qt', 'gal', 'ml', 'l', '大さじ', '小さじ', '杯']);
const WEIGHT_UNITS = new Set(['oz', 'lb', 'g', 'kg']);
const IMPERIAL_UNITS = new Set(['cup', 'tbsp', 'tsp', 'fl oz', 'pt', 'qt', 'gal', 'oz', 'lb']);
const METRIC_UNITS  = new Set(['ml', 'l', 'g', 'kg']);

for (const u of VOLUME_UNITS) UNIT_TYPE[u] = 'volume';
for (const u of WEIGHT_UNITS) UNIT_TYPE[u] = 'weight';
UNIT_TYPE['大さじ'] = 'volume';
UNIT_TYPE['小さじ'] = 'volume';
UNIT_TYPE['杯'] = 'volume';

/**
 * Convert a value from one unit to another.
 * Returns null if conversion is not possible (incompatible types or unknown units).
 *
 * @param {number} value
 * @param {string} fromUnit
 * @param {string} toUnit
 * @returns {number|null}
 */
export function convert(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;

  const fromBase = TO_BASE[fromUnit];
  const toBase = TO_BASE[toUnit];

  if (fromBase === undefined || toBase === undefined) return null;

  // Must be same type
  const fromType = UNIT_TYPE[fromUnit];
  const toType = UNIT_TYPE[toUnit];
  if (fromType !== toType) return null;

  return (value * fromBase) / toBase;
}

/**
 * @param {string} unit
 * @returns {boolean}
 */
export function isImperial(unit) {
  return IMPERIAL_UNITS.has(unit);
}

/**
 * @param {string} unit
 * @returns {boolean}
 */
export function isMetric(unit) {
  return METRIC_UNITS.has(unit);
}

/**
 * Convert ingredient to best-fit metric unit.
 * Returns new ingredient object; if no conversion available, returns original.
 *
 * @param {{ quantity: number, unit: string|null, name: string, raw: string }} ingredient
 * @returns {{ quantity: number, unit: string|null, name: string, raw: string }}
 */
export function toMetric(ingredient) {
  const { quantity, unit } = ingredient;
  if (quantity === null || unit === null) return ingredient;
  if (isMetric(unit)) return ingredient;

  const type = UNIT_TYPE[unit];
  if (type === 'volume') {
    const ml = convert(quantity, unit, 'ml');
    if (ml === null) return ingredient;
    // Choose l if >= 1000ml, else ml
    if (ml >= 1000) {
      return { ...ingredient, quantity: ml / 1000, unit: 'l' };
    }
    return { ...ingredient, quantity: ml, unit: 'ml' };
  }
  if (type === 'weight') {
    const g = convert(quantity, unit, 'g');
    if (g === null) return ingredient;
    if (g >= 1000) {
      return { ...ingredient, quantity: g / 1000, unit: 'kg' };
    }
    return { ...ingredient, quantity: g, unit: 'g' };
  }
  return ingredient;
}

/**
 * Convert ingredient to best-fit imperial unit.
 * Returns new ingredient object; if no conversion available, returns original.
 *
 * @param {{ quantity: number, unit: string|null, name: string, raw: string }} ingredient
 * @returns {{ quantity: number, unit: string|null, name: string, raw: string }}
 */
export function toImperial(ingredient) {
  const { quantity, unit } = ingredient;
  if (quantity === null || unit === null) return ingredient;
  if (isImperial(unit)) return ingredient;

  const type = UNIT_TYPE[unit];
  if (type === 'volume') {
    const ml = convert(quantity, unit, 'ml');
    if (ml === null) return ingredient;
    // Choose best imperial unit
    if (ml >= 3785) return { ...ingredient, quantity: ml / 3785.41, unit: 'gal' };
    if (ml >= 473)  return { ...ingredient, quantity: ml / 473.176, unit: 'pt' };
    if (ml >= 60)   return { ...ingredient, quantity: ml / 240, unit: 'cup' };
    if (ml >= 15)   return { ...ingredient, quantity: ml / 15, unit: 'tbsp' };
    return { ...ingredient, quantity: ml / 5, unit: 'tsp' };
  }
  if (type === 'weight') {
    const g = convert(quantity, unit, 'g');
    if (g === null) return ingredient;
    if (g >= 453) return { ...ingredient, quantity: g / 453.592, unit: 'lb' };
    return { ...ingredient, quantity: g / 28.3495, unit: 'oz' };
  }
  return ingredient;
}
