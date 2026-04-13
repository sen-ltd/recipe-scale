/**
 * parser.js — Ingredient line parser
 * Parses quantities (fractions, decimals, mixed), units, and ingredient names.
 */

// Unicode fraction map
const UNICODE_FRACTIONS = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};

/**
 * Unit definitions with canonical form and aliases.
 * Each entry: { canonical, aliases, type }
 */
export const KNOWN_UNITS = [
  // Volume - imperial
  { canonical: 'cup',   aliases: ['cup', 'cups', 'c'],          type: 'volume' },
  { canonical: 'tbsp',  aliases: ['tbsp', 'tablespoon', 'tablespoons', 'tbs', 'T'], type: 'volume' },
  { canonical: 'tsp',   aliases: ['tsp', 'teaspoon', 'teaspoons', 't'],             type: 'volume' },
  { canonical: 'fl oz', aliases: ['fl oz', 'fl. oz', 'fluid oz', 'fluid ounce', 'fluid ounces'], type: 'volume' },
  { canonical: 'pt',    aliases: ['pt', 'pint', 'pints'],       type: 'volume' },
  { canonical: 'qt',    aliases: ['qt', 'quart', 'quarts'],     type: 'volume' },
  { canonical: 'gal',   aliases: ['gal', 'gallon', 'gallons'],  type: 'volume' },
  // Volume - metric
  { canonical: 'ml',    aliases: ['ml', 'mL', 'milliliter', 'milliliters', 'millilitre', 'millilitres'], type: 'volume' },
  { canonical: 'l',     aliases: ['l', 'L', 'liter', 'liters', 'litre', 'litres'],                      type: 'volume' },
  // Volume - Japanese
  { canonical: '大さじ', aliases: ['大さじ'],                    type: 'volume' },
  { canonical: '小さじ', aliases: ['小さじ'],                    type: 'volume' },
  { canonical: '杯',     aliases: ['杯'],                        type: 'volume' },
  // Weight - imperial
  { canonical: 'oz',    aliases: ['oz', 'ounce', 'ounces'],     type: 'weight' },
  { canonical: 'lb',    aliases: ['lb', 'lbs', 'pound', 'pounds'], type: 'weight' },
  // Weight - metric
  { canonical: 'g',     aliases: ['g', 'gram', 'grams'],        type: 'weight' },
  { canonical: 'kg',    aliases: ['kg', 'kilogram', 'kilograms'], type: 'weight' },
  // Count - Japanese
  { canonical: '個',    aliases: ['個'],                         type: 'count' },
  { canonical: '本',    aliases: ['本'],                         type: 'count' },
  { canonical: '片',    aliases: ['片'],                         type: 'count' },
  { canonical: '枚',    aliases: ['枚'],                         type: 'count' },
  { canonical: '束',    aliases: ['束'],                         type: 'count' },
  // Count - English
  { canonical: 'piece', aliases: ['piece', 'pieces', 'pc', 'pcs'], type: 'count' },
  { canonical: 'clove', aliases: ['clove', 'cloves'],           type: 'count' },
  { canonical: 'slice', aliases: ['slice', 'slices'],           type: 'count' },
  { canonical: 'can',   aliases: ['can', 'cans'],               type: 'count' },
  { canonical: 'pkg',   aliases: ['pkg', 'package', 'packages', 'packet', 'packets'], type: 'count' },
  { canonical: 'pinch', aliases: ['pinch', 'pinches'],          type: 'count' },
  { canonical: 'dash',  aliases: ['dash', 'dashes'],            type: 'count' },
  { canonical: 'drop',  aliases: ['drop', 'drops'],             type: 'count' },
];

// Build lookup map: lowercase alias → canonical
const _aliasMap = new Map();
for (const unit of KNOWN_UNITS) {
  for (const alias of unit.aliases) {
    _aliasMap.set(alias.toLowerCase(), unit.canonical);
  }
}

/**
 * Normalize alias to canonical unit name.
 * @param {string} str
 * @returns {string|null}
 */
export function normalizeUnit(str) {
  if (!str) return null;
  return _aliasMap.get(str.toLowerCase()) ?? null;
}

/**
 * Parse a quantity string that may contain:
 * - Unicode fraction: ½, ¼, etc.
 * - Simple fraction: 1/2, 3/4
 * - Decimal: 1.5, 2.25
 * - Integer: 3
 * - Mixed: "1 1/2", "2½"
 *
 * @param {string} str
 * @returns {number|null}
 */
export function parseQuantity(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  if (!str) return null;

  let total = 0;
  let remaining = str;

  // Replace unicode fractions with decimal equivalents for easier parsing
  for (const [char, val] of Object.entries(UNICODE_FRACTIONS)) {
    if (remaining.includes(char)) {
      // Check for leading integer: e.g. "1½"
      const mixed = remaining.match(new RegExp(`^(\\d+)\\s*${escapeRegex(char)}$`));
      if (mixed) {
        return parseInt(mixed[1], 10) + val;
      }
      // Standalone unicode fraction
      const standalone = remaining.match(new RegExp(`^${escapeRegex(char)}$`));
      if (standalone) {
        return val;
      }
    }
  }

  // Mixed number with fraction: "1 1/2"
  const mixedFrac = remaining.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedFrac) {
    const whole = parseInt(mixedFrac[1], 10);
    const num = parseInt(mixedFrac[2], 10);
    const den = parseInt(mixedFrac[3], 10);
    if (den === 0) return null;
    return whole + num / den;
  }

  // Simple fraction: "1/2"
  const simpleFrac = remaining.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (simpleFrac) {
    const num = parseInt(simpleFrac[1], 10);
    const den = parseInt(simpleFrac[2], 10);
    if (den === 0) return null;
    return num / den;
  }

  // Decimal or integer
  const num = parseFloat(remaining);
  if (!isNaN(num)) return num;

  return null;
}

/**
 * Escape regex special chars in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse a single ingredient line.
 *
 * Handles English patterns:
 *   "1 1/2 cups flour"
 *   "200g sugar"
 *   "2 tbsp olive oil"
 *   "salt to taste"
 *   "a pinch of cinnamon"
 *
 * Handles Japanese patterns:
 *   "大さじ 2 の醤油"
 *   "醤油 大さじ2"
 *   "卵 3 個"
 *   "にんじん 2本"
 *
 * @param {string} line
 * @returns {{ quantity: number|null, unit: string|null, name: string, raw: string }}
 */
export function parseLine(line) {
  const raw = line;
  line = line.trim();

  if (!line) {
    return { quantity: null, unit: null, name: '', raw };
  }

  // Build regex pattern for unit alternatives (longest first to avoid prefix match issues)
  // We'll do manual parsing instead of one giant regex for reliability.

  // --- Strategy ---
  // 1. Try Japanese-first patterns (unit appears before quantity, or qty+unit together)
  // 2. Try English patterns (qty first, then optional unit, then name)

  // Japanese pattern A: "大さじ 2 の醤油" or "大さじ2 醤油" or "大さじ2の醤油"
  const jpUnitFirst = tryJpUnitFirst(line);
  if (jpUnitFirst) return { ...jpUnitFirst, raw };

  // Japanese pattern B: "卵 3 個" or "にんじん 2本"
  const jpNameFirst = tryJpNameFirst(line);
  if (jpNameFirst) return { ...jpNameFirst, raw };

  // English pattern: optional quantity, optional unit, name
  const eng = tryEnglish(line);
  if (eng) return { ...eng, raw };

  // Fallback: treat whole line as name
  return { quantity: null, unit: null, name: line, raw };
}

/**
 * Try Japanese unit-first pattern: "大さじ 2 の醤油"
 */
function tryJpUnitFirst(line) {
  const jpUnits = ['大さじ', '小さじ', '杯'];
  for (const u of jpUnits) {
    // e.g. "大さじ2の醤油" or "大さじ 2 の醤油" or "大さじ 2 醤油"
    const re = new RegExp(`^${escapeRegex(u)}\\s*(${QUANTITY_PATTERN})\\s*(?:の|\\s)\\s*(.+)$`);
    const m = line.match(re);
    if (m) {
      const qty = parseQuantity(m[1].trim());
      const name = m[m.length - 1].trim();
      return { quantity: qty, unit: u, name };
    }
    // Just unit+qty, no name (unlikely but handle)
    const re2 = new RegExp(`^${escapeRegex(u)}\\s*(${QUANTITY_PATTERN})$`);
    const m2 = line.match(re2);
    if (m2) {
      return { quantity: parseQuantity(m2[1].trim()), unit: u, name: '' };
    }
  }
  return null;
}

/**
 * Try Japanese name-first pattern: "卵 3 個" or "にんじん2本"
 */
function tryJpNameFirst(line) {
  const jpCountUnits = ['個', '本', '片', '枚', '束'];
  for (const u of jpCountUnits) {
    // "名前 数量 単位" or "名前数量単位"
    const re = new RegExp(`^(.+?)\\s*(${QUANTITY_PATTERN})\\s*${escapeRegex(u)}$`);
    const m = line.match(re);
    if (m) {
      const name = m[1].trim();
      const qty = parseQuantity(m[2].trim());
      if (qty !== null && name) {
        return { quantity: qty, unit: u, name };
      }
    }
  }
  return null;
}

// Quantity patterns: mixed "1 1/2", fraction "1/2", decimal/int "1.5", unicode fractions
const UNICODE_FRAC_PATTERN = Object.keys(UNICODE_FRACTIONS)
  .map(escapeRegex)
  .join('|');

const QUANTITY_PATTERN = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\.\\d+|\\d+\\/\\d+|\\d+\\s*(?:${UNICODE_FRAC_PATTERN})|\\d+|${UNICODE_FRAC_PATTERN})`;

/**
 * Try English pattern parsing.
 */
function tryEnglish(line) {
  // Build sorted unit alias list (longest first to avoid greedy prefix issues)
  const allAliases = [..._aliasMap.keys()].sort((a, b) => b.length - a.length);
  const unitPattern = allAliases.map(escapeRegex).join('|');

  // Pattern: [quantity] [unit] name
  // e.g. "1 1/2 cups flour", "2tbsp oil", "200g sugar", "3 eggs"
  const re = new RegExp(
    `^(${QUANTITY_PATTERN})\\s*` +
    `(${unitPattern})\\.?\\s+(.+)$`,
    'i'
  );
  let m = line.match(re);
  if (m) {
    const qty = parseQuantity(m[1].trim());
    const unit = normalizeUnit(m[2].trim());
    const name = m[3].trim();
    if (qty !== null) {
      return { quantity: qty, unit, name };
    }
  }

  // Pattern: quantity unit (no space between qty and unit): "200g sugar"
  const re2 = new RegExp(
    `^(${QUANTITY_PATTERN})\\s*(${unitPattern})\\.?\\s*(.*)$`,
    'i'
  );
  m = line.match(re2);
  if (m) {
    const qty = parseQuantity(m[1].trim());
    const unit = normalizeUnit(m[2].trim());
    const name = m[3].trim();
    if (qty !== null) {
      return { quantity: qty, unit: unit, name: name || '' };
    }
  }

  // Pattern: quantity only (no unit): "3 eggs", "2 carrots"
  const re3 = new RegExp(`^(${QUANTITY_PATTERN})\\s+(.+)$`);
  m = line.match(re3);
  if (m) {
    const qty = parseQuantity(m[1].trim());
    const name = m[2].trim();
    if (qty !== null) {
      return { quantity: qty, unit: null, name };
    }
  }

  // No quantity found
  return { quantity: null, unit: null, name: line };
}
