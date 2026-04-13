/**
 * i18n.js — Japanese/English translations
 */

export const translations = {
  en: {
    appTitle: 'Recipe Scale',
    appSubtitle: 'Scale any recipe to any serving size',
    pasteLabel: 'Paste your ingredient list (one per line)',
    pastePlaceholder: '1 1/2 cups flour\n2 tbsp olive oil\n1 tsp salt\n200g sugar\n卵 3 個',
    parseBtn: 'Parse Ingredients',
    clearBtn: 'Clear',
    originalServings: 'Original Servings',
    targetServings: 'Target Servings',
    unitSystem: 'Units',
    unitOriginal: 'Original',
    unitMetric: 'Metric',
    unitImperial: 'Imperial',
    copyBtn: 'Copy Scaled Recipe',
    copiedMsg: 'Copied!',
    originalList: 'Original',
    scaledList: 'Scaled',
    noIngredients: 'No ingredients yet. Paste a list above and click Parse.',
    editBtn: 'Edit',
    saveBtn: 'Save',
    cancelBtn: 'Cancel',
    quantityLabel: 'Qty',
    unitLabel: 'Unit',
    nameLabel: 'Name',
    unparsedNote: 'No quantity — will not be scaled',
    factor: 'Scale factor',
    lang: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    footer: 'Built by SEN LLC',
  },
  ja: {
    appTitle: 'レシピスケーリング',
    appSubtitle: 'レシピの分量を自動で換算',
    pasteLabel: '材料リストを貼り付け（1行1材料）',
    pastePlaceholder: '小麦粉 1½カップ\nオリーブオイル 大さじ2\n塩 小さじ1\n砂糖 200g\n卵 3 個',
    parseBtn: '材料を解析',
    clearBtn: 'クリア',
    originalServings: '元の人数',
    targetServings: '目標人数',
    unitSystem: '単位系',
    unitOriginal: 'そのまま',
    unitMetric: 'メトリック',
    unitImperial: 'インペリアル',
    copyBtn: 'スケール済みレシピをコピー',
    copiedMsg: 'コピーしました！',
    originalList: '元のレシピ',
    scaledList: 'スケール後',
    noIngredients: '材料がありません。上にリストを貼り付けて「解析」を押してください。',
    editBtn: '編集',
    saveBtn: '保存',
    cancelBtn: 'キャンセル',
    quantityLabel: '分量',
    unitLabel: '単位',
    nameLabel: '材料名',
    unparsedNote: '数量なし — スケールされません',
    factor: '倍率',
    lang: '言語',
    theme: 'テーマ',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    footer: 'SEN 合同会社 制作',
  },
};

/**
 * Get translation string.
 * @param {string} lang - 'en' | 'ja'
 * @param {string} key
 * @returns {string}
 */
export function t(lang, key) {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
