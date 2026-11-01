# Chaos Empire Browser

A searchable browser for the runewords of Chaos Empire, a Diablo II mod. It lists all 169 runewords from the Chaos Empire 7.67 item list.

**Live site:** https://teruncius.github.io/chaos-empire-browser/

## Features

- Filter by name, level requirement, item type, socket count, runes and attributes. All filters are combined with AND.
- Filter by attribute with an optional minimum value, e.g. at least 30% Increased Attack Speed. Matching attributes are highlighted.
- Include broader item categories when filtering, so Swords also matches "Melee Weapons" and "All Weapons".
- Show the mods each rune adds, per weapon, armor or shield slot.
- Sort by level or name.

## Development

The deployment builds with Node.js 24, so use that version locally too.

```sh
npm ci
npm run dev
```

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server          |
| `npm run build`        | Type-check and build to `dist`     |
| `npm run preview`      | Serve the production build locally |
| `npm run lint`         | Lint with Oxlint                   |
| `npm run format`       | Format with oxfmt                  |
| `npm run format:check` | Check formatting without writing   |

The `justfile` also has `just run`, `just lint` (includes a type-check) and `just format`.

## Data

The app reads its data from `src/data/runes.json`, which is generated from the original item list in `ItemList`. To regenerate it:

```sh
node scripts/convert-runes.mjs
```

The script reads `ItemList/runewords.html` and `ItemList/gems.html`. It doesn't copy images, so the rune icons in `public/runes` have to be updated by hand.

## Deployment

Every push to `master` builds the app and deploys it to GitHub Pages through `.github/workflows/pages.yml`.
