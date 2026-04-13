# Recipe Scale

A recipe ingredient scaling calculator built with vanilla JS — zero dependencies, no build step.

**Live demo**: https://sen.ltd/portfolio/recipe-scale/

## Features

- Paste an ingredient list (one per line) and parse quantities automatically
- Supports fractions (`1/2`), decimals (`2.5`), mixed numbers (`1 1/2`), and unicode fractions (`½`)
- Recognizes common units: cups, tbsp, tsp, oz, lb, g, kg, ml, l
- Japanese units: 大さじ, 小さじ, 杯, 個, 本, 片, etc.
- Set original and target servings — all quantities scale automatically
- Toggle between original / metric / imperial unit systems
- Smart fraction display: `0.5` → `½`, `1.5` → `1½`
- Edit individual ingredients after parsing
- Copy the scaled recipe to clipboard
- Japanese / English UI
- Dark / light theme

## Setup

```sh
# Serve locally
npm run serve
# Open http://localhost:8080
```

## Tests

```sh
node --test tests/*.test.js
```

Requires Node.js 20+.

## Project structure

```
├── index.html        # App entry point
├── style.css         # All styles (dark/light theme via CSS variables)
├── src/
│   ├── main.js       # DOM, events, state, rendering
│   ├── parser.js     # Ingredient line parser
│   ├── scale.js      # Scaling and fraction formatting
│   ├── convert.js    # Unit conversions
│   └── i18n.js       # ja/en translations
└── tests/
    ├── parser.test.js
    └── scale.test.js
```

## License

MIT © 2026 SEN LLC (SEN 合同会社)
