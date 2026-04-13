/**
 * scale.js — Scaling logic and fraction formatting
 */

/**
 * Common fractions to recognize, in order of priority.
 * Each: [numerator, denominator, display string]
 */
const FRACTION_MAP = [
  [1, 2, '½'],
  [1, 3, '⅓'],
  [2, 3, '⅔'],
  [1, 4, '¼'],
  [3, 4, '¾'],
  [1, 5, '⅕'],
  [2, 5, '⅖'],
  [3, 5, '⅗'],
  [4, 5, '⅘'],
  [1, 6, '⅙'],
  [5, 6, '⅚'],
  [1, 8, '⅛'],
  [3, 8, '⅜'],
  [5, 8, '⅝'],
  [7, 8, '⅞'],
];

/**
 * Find the closest named fraction for a decimal value in [0, 1).
 * Returns the unicode fraction character or null if none is close enough.
 *
 * @param {number} decimal - value in [0,1)
 * @param {number} tolerance
 * @returns {string|null}
 */
function findUnicodeFraction(decimal, tolerance = 0.02) {
  if (decimal <= tolerance) return null; // close to 0, no fraction needed
  for (const [num, den, sym] of FRACTION_MAP) {
    if (Math.abs(decimal - num / den) <= tolerance) {
      return sym;
    }
  }
  return null;
}

/**
 * Format a number as a human-friendly quantity string.
 * - Integers: "2"
 * - Halves/thirds/quarters etc.: "½", "⅓", "¾"
 * - Mixed: "1½", "2⅓"
 * - Other decimals: rounded to 2 significant digits
 *
 * @param {number} n
 * @param {number} [tolerance=0.02]
 * @returns {string}
 */
export function formatQuantity(n, tolerance = 0.02) {
  if (n === null || n === undefined || isNaN(n)) return '';
  if (n === 0) return '0';

  const whole = Math.floor(n);
  const frac = n - whole;

  // Check if the fractional part matches a unicode fraction
  const fracStr = findUnicodeFraction(frac, tolerance);

  if (fracStr !== null) {
    return whole === 0 ? fracStr : `${whole}${fracStr}`;
  }

  // Close to integer
  if (Math.abs(frac) <= tolerance) {
    return String(whole);
  }

  // Otherwise, show as decimal rounded sensibly
  // Use up to 2 decimal places, trimming trailing zeros
  const rounded = Math.round(n * 100) / 100;
  const str = rounded.toString();
  return str;
}

/**
 * Decompose a decimal into { numerator, denominator } as the closest simple fraction.
 * Uses Stern-Brocot / Farey sequence approach.
 *
 * @param {number} decimal
 * @param {number} [tolerance=0.01]
 * @returns {{ numerator: number, denominator: number }}
 */
export function toFraction(decimal, tolerance = 0.01) {
  if (decimal === 0) return { numerator: 0, denominator: 1 };

  const sign = decimal < 0 ? -1 : 1;
  decimal = Math.abs(decimal);

  // Check common fractions first
  for (const [num, den] of FRACTION_MAP) {
    if (Math.abs(decimal - num / den) <= tolerance) {
      return { numerator: sign * num, denominator: den };
    }
  }

  // Continued fraction algorithm for best rational approximation
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = decimal;
  let maxIter = 20;
  while (maxIter-- > 0) {
    const a = Math.floor(b);
    const h = a * h1 + h2;
    const k = a * k1 + k2;
    if (Math.abs(decimal - h / k) < tolerance) {
      return { numerator: sign * h, denominator: k };
    }
    h2 = h1; h1 = h;
    k2 = k1; k1 = k;
    b = 1 / (b - a);
    if (!isFinite(b)) break;
  }

  return { numerator: sign * h1, denominator: k1 };
}

/**
 * Scale an ingredient by a factor.
 *
 * @param {{ quantity: number|null, unit: string|null, name: string, raw: string }} ingredient
 * @param {number} factor
 * @returns {{ quantity: number|null, unit: string|null, name: string, raw: string }}
 */
export function scaleIngredient(ingredient, factor) {
  if (ingredient.quantity === null) {
    return { ...ingredient };
  }
  return {
    ...ingredient,
    quantity: ingredient.quantity * factor,
  };
}
