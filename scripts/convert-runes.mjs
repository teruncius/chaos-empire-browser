// Converts ItemList/runewords.html (ISO-8859-1) into src/data/runes.json.
// Usage: node scripts/convert-runes.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(root, 'ItemList/runewords.html'), 'latin1')

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

const stripTags = (s) =>
  decode(s.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()

const cell = (row, cls) => {
  const m = row.match(new RegExp(`<td class="${cls}">([\\s\\S]*?)</td>`))
  if (!m) throw new Error(`Missing cell ${cls}`)
  return m[1]
}

// Item type legend at the bottom of the page: <a name="code"></a>Label</td><td>Description</td>
const itemTypes = [
  ...html.matchAll(/<tr><td><a name="(\w+)"><\/a>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g),
].map(([, code, label, description]) => ({
  code,
  label: decode(label).trim(),
  description: decode(description).trim(),
}))

const RUNE_MODS_LINE = /^And the Mods from the Runes\.?$/i

// Turns "Level 4 Corpse Explosion (12 Charges)" into the key "Level # Corpse Explosion (# Charges)"
// so equal stats with different numbers can be grouped and filtered together.
const NUMBER = /[+-]?\d+(?:\.\d+)?/g

const runewords = html
  .split(/<tr>/)
  .filter((row) => row.includes('class="runeiteminfo"'))
  .map((row) => {
    const info = cell(row, 'runeiteminfo')
    const runesCell = cell(row, 'runeneedruns')
    const statsCell = cell(row, 'runeattributes')

    const name = stripTags(info.match(/class="runeitemname">([\s\S]*?)<\/span>/)[1])
    const level = Number(info.match(/Lvl req:\s*(\d+)/)[1])
    const items = [...info.matchAll(/href="#(\w+)"/g)].map((m) => m[1])
    const runes = stripTags(runesCell.match(/class="runerunename">([\s\S]*?)<\/span>/)[1])
      .split('+')
      .map((r) => r.trim())
    const runeImages = [...runesCell.matchAll(/src="images\/uniques\/([^"]+)"/g)].map((m) => m[1])
    const sockets = Number(runesCell.match(/(\d+)\s*Socket/)[1])

    const statLines = statsCell
      .split(/<br\s*\/?>/i)
      .map(stripTags)
      .filter(Boolean)
    const includesRuneMods = statLines.some((l) => RUNE_MODS_LINE.test(l))
    const attributes = statLines
      .filter((l) => !RUNE_MODS_LINE.test(l))
      .map((text) => ({
        text,
        key: text.replace(NUMBER, '#'),
        values: (text.match(NUMBER) ?? []).map(Number),
      }))

    return { name, level, items, runes, runeImages, sockets, includesRuneMods, attributes }
  })

const unknownItems = new Set(
  runewords.flatMap((r) => r.items).filter((c) => !itemTypes.some((t) => t.code === c)),
)
for (const code of unknownItems) {
  // Codes linked from runewords but missing from the legend (e.g. "dham").
  itemTypes.push({ code, label: code === 'dham' ? 'Druid Hammers' : code, description: '' })
}

// Single rune stats from gems.html, which lists the mods per slot (weapon, armor, shield).
const gemsHtml = readFileSync(resolve(root, 'ItemList/gems.html'), 'latin1')
const modLines = (s) =>
  s
    .split(/<br\s*\/?>/i)
    .map((l) => stripTags(l).replace(/\s+%/g, '%'))
    .filter(Boolean)

const runes = gemsHtml
  .split(/<tr>/)
  .filter((row) => /src="images\/uniques\/rune\w+\.gif"/.test(row))
  .map((row) => ({
    name: stripTags(cell(row, 'gemsbild')),
    image: row.match(/src="images\/uniques\/(rune\w+\.gif)"/)[1],
    level: Number(stripTags(cell(row, 'gemslevreq'))),
    mods: {
      weapon: modLines(cell(row, 'gemsmodsweap')),
      armor: modLines(cell(row, 'gemsmodsarmo')),
      shield: modLines(cell(row, 'gemsmodsshie')),
    },
  }))

const missingRunes = new Set(
  runewords.flatMap((r) => r.runes).filter((n) => !runes.some((r) => r.name === n)),
)
if (missingRunes.size)
  throw new Error(`Runes missing from gems.html: ${[...missingRunes].join(', ')}`)

const out = resolve(root, 'src/data/runes.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(
  out,
  JSON.stringify({ source: 'Chaos Empire RuneWords 7.67', itemTypes, runes, runewords }, null, 2) +
    '\n',
)
console.log(
  `Wrote ${runewords.length} runewords, ${runes.length} runes and ${itemTypes.length} item types to ${out}`,
)
