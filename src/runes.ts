import data from './data/runes.json'

export interface Attribute {
  text: string
  /** The stat text with every number replaced by "#", used to group equal stats. */
  key: string
  values: number[]
}

export interface Runeword {
  name: string
  level: number
  items: string[]
  runes: string[]
  runeImages: string[]
  sockets: number
  includesRuneMods: boolean
  attributes: Attribute[]
}

export interface ItemType {
  code: string
  label: string
  description: string
}

export type Slot = 'weapon' | 'armor' | 'shield'

export interface Rune {
  name: string
  image: string
  level: number
  mods: Record<Slot, string[]>
}

export const runewords: Runeword[] = data.runewords
export const itemTypes: ItemType[] = data.itemTypes
export const runes: Rune[] = data.runes

export const runeByName = new Map(runes.map((r) => [r.name, r]))

export const slotLabels: Record<Slot, string> = {
  weapon: 'Weapons',
  armor: 'Armors',
  shield: 'Shields',
}

const ARMOR = ['armo', 'helm', 'circ', 'barb', 'drui', 'tors']
const SHIELD = ['shld', 'pala', 'necr']

const slotOf = (code: string): Slot =>
  SHIELD.includes(code) ? 'shield' : ARMOR.includes(code) ? 'armor' : 'weapon'

/** The slots a runeword can be socketed into, which decides which rune mods apply. */
export const runewordSlots = (runeword: Runeword) =>
  (['weapon', 'armor', 'shield'] as const).filter((slot) =>
    runeword.items.some((code) => slotOf(code) === slot),
  )

export const itemLabel = (code: string) => itemTypes.find((t) => t.code === code)?.label ?? code

const MELEE = [
  'club',
  'hamm',
  'mace',
  'swor',
  'axe',
  'scep',
  'staf',
  'wand',
  'pole',
  'h2h',
  'spea',
  'aspe',
  'dham',
]

/**
 * Broader item categories that also cover an item type, based on the legend in runewords.html,
 * e.g. a sword can take "Swords", "Melee Weapons" and "All Weapons" runewords.
 */
const PARENTS: Record<string, string[]> = {
  ...Object.fromEntries(MELEE.map((code) => [code, ['mele', 'weap']])),
  mele: ['weap'],
  miss: ['weap'],
  abow: ['miss', 'weap'],
  aspe: ['spea', 'mele', 'weap'],
  jave: ['weap'],
  thro: ['weap'],
  orb: ['weap'],
  helm: ['armo'],
  circ: ['helm', 'armo'],
  barb: ['helm', 'armo'],
  drui: ['helm', 'armo'],
  tors: ['armo'],
  pala: ['shld'],
  necr: ['shld'],
}

/** Whether a runeword can be put into the given item type. */
export const fitsItem = (runeword: Runeword, code: string, includeParents: boolean) =>
  runeword.items.includes(code) ||
  (includeParents && (PARENTS[code] ?? []).some((p) => runeword.items.includes(p)))

export const levelBounds = [
  Math.min(...runewords.map((r) => r.level)),
  Math.max(...runewords.map((r) => r.level)),
] as [number, number]

export const socketCounts = [...new Set(runewords.map((r) => r.sockets))].sort((a, b) => a - b)

export const allRunes = [...new Set(runewords.flatMap((r) => r.runes))].sort()

/** Every distinct attribute key with the number of runewords that have it, most common first. */
export const attributeKeys = [
  ...runewords
    .flatMap((r) => [...new Set(r.attributes.map((a) => a.key))])
    .reduce(
      (counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1),
      new Map<string, number>(),
    ),
]
  .map(([key, count]) => ({ key, count }))
  .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

export interface AttributeFilter {
  id: number
  key: string | null
  /** Minimum for the first number in the stat, e.g. 30 for "30% Increased Attack Speed". */
  min: number | null
}

export interface Filters {
  search: string
  level: [number, number]
  items: string[]
  includeParentItems: boolean
  sockets: string[]
  runes: string[]
  attributes: AttributeFilter[]
}

export const matchesAttribute = (attribute: Attribute, filter: AttributeFilter) =>
  attribute.key === filter.key && (filter.min == null || (attribute.values[0] ?? 0) >= filter.min)

/** Every active filter must match (AND), including every selected item, rune and attribute. */
export const matches = (r: Runeword, f: Filters) => {
  const search = f.search.trim().toLowerCase()
  return (
    (!search || r.name.toLowerCase().includes(search)) &&
    r.level >= f.level[0] &&
    r.level <= f.level[1] &&
    f.items.every((code) => fitsItem(r, code, f.includeParentItems)) &&
    (f.sockets.length === 0 || f.sockets.includes(String(r.sockets))) &&
    f.runes.every((rune) => r.runes.includes(rune)) &&
    f.attributes.every((af) => !af.key || r.attributes.some((a) => matchesAttribute(a, af)))
  )
}
