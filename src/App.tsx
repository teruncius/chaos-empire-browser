import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Grid,
  Group,
  Image,
  MultiSelect,
  NumberInput,
  Paper,
  RangeSlider,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  type AttributeFilter,
  type Filters,
  type Runeword,
  allRunes,
  attributeKeys,
  itemLabel,
  itemTypes,
  levelBounds,
  matches,
  matchesAttribute,
  runeByName,
  runewordSlots,
  runewords,
  slotLabels,
  socketCounts,
} from './runes'

const emptyFilters = (): Filters => ({
  search: '',
  level: levelBounds,
  items: [],
  includeParentItems: true,
  sockets: [],
  runes: [],
  attributes: [],
})

type SortKey = 'level-asc' | 'level-desc' | 'name'

const sorters: Record<SortKey, (a: Runeword, b: Runeword) => number> = {
  'level-asc': (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  'level-desc': (a, b) => b.level - a.level || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
}

const itemOptions = [...itemTypes]
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((t) => ({ value: t.code, label: t.label }))

const attributeOptions = attributeKeys.map(({ key, count }) => ({
  value: key,
  label: `${key} (${count})`,
}))

let nextAttributeId = 1

function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })
  const setAttribute = (id: number, patch: Partial<AttributeFilter>) =>
    set(
      'attributes',
      filters.attributes.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )

  return (
    <Stack gap="md">
      <TextInput
        label="Name"
        placeholder="e.g. Enigma"
        value={filters.search}
        onChange={(e) => set('search', e.currentTarget.value)}
      />

      <Box>
        <Text size="sm" fw={500} mb={4}>
          Level requirement: {filters.level[0]} – {filters.level[1]}
        </Text>
        <RangeSlider
          min={levelBounds[0]}
          max={levelBounds[1]}
          minRange={0}
          value={filters.level}
          onChange={(v) => set('level', v)}
          marks={[
            { value: levelBounds[0], label: levelBounds[0] },
            { value: levelBounds[1], label: levelBounds[1] },
          ]}
          mb="lg"
        />
      </Box>

      <Stack gap={6}>
        <MultiSelect
          label="Item types"
          description="Runeword must fit every selected type"
          placeholder="Any item"
          data={itemOptions}
          value={filters.items}
          onChange={(v) => set('items', v)}
          searchable
          clearable
        />
        <Checkbox
          size="xs"
          label='Include broader categories (Swords also matches "Melee Weapons", "All Weapons")'
          checked={filters.includeParentItems}
          onChange={(e) => set('includeParentItems', e.currentTarget.checked)}
        />
      </Stack>

      <Box>
        <Text size="sm" fw={500} mb={6}>
          Sockets
        </Text>
        <Chip.Group multiple value={filters.sockets} onChange={(v) => set('sockets', v)}>
          <Group gap={6}>
            {socketCounts.map((n) => (
              <Chip key={n} value={String(n)} size="xs">
                {n}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Box>

      <MultiSelect
        label="Runes"
        description="Runeword must contain every selected rune"
        placeholder="Any rune"
        data={allRunes}
        value={filters.runes}
        onChange={(v) => set('runes', v)}
        searchable
        clearable
      />

      <Stack gap="xs">
        <Box>
          <Text size="sm" fw={500}>
            Attributes
          </Text>
          <Text size="xs" c="dimmed">
            Runeword must have every attribute. The minimum applies to the first number.
          </Text>
        </Box>
        {filters.attributes.map((af) => (
          <Group key={af.id} gap={6} align="flex-end" wrap="nowrap">
            <Select
              style={{ flex: 1, minWidth: 0 }}
              placeholder="Search attributes"
              data={attributeOptions}
              value={af.key}
              onChange={(key) => setAttribute(af.id, { key })}
              searchable
              limit={50}
            />
            <NumberInput
              w={80}
              placeholder="min"
              value={af.min ?? ''}
              onChange={(v) => setAttribute(af.id, { min: typeof v === 'number' ? v : null })}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label="Remove attribute filter"
              onClick={() =>
                set(
                  'attributes',
                  filters.attributes.filter((a) => a.id !== af.id),
                )
              }
            >
              ✕
            </ActionIcon>
          </Group>
        ))}
        <Button
          variant="light"
          size="xs"
          onClick={() =>
            set('attributes', [
              ...filters.attributes,
              { id: nextAttributeId++, key: null, min: null },
            ])
          }
        >
          + Add attribute filter
        </Button>
      </Stack>

      <Button variant="default" onClick={() => onChange(emptyFilters())}>
        Reset all filters
      </Button>
    </Stack>
  )
}

function RunewordCard({
  runeword,
  attributeFilters,
  showRuneStats,
}: {
  runeword: Runeword
  attributeFilters: AttributeFilter[]
  showRuneStats: boolean
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
        <Title order={4} c="orange.4">
          {runeword.name}
        </Title>
        <Badge variant="light" style={{ flexShrink: 0 }}>
          Lvl {runeword.level}
        </Badge>
      </Group>

      <Group gap={4} mb={4}>
        {runeword.runeImages.map((img, i) => (
          <Image
            key={i}
            src={`/runes/${img}`}
            alt={runeword.runes[i]}
            w={28}
            h={28}
            fit="contain"
          />
        ))}
        <Text size="sm" ml={6}>
          {runeword.runes.join(' + ')}
        </Text>
      </Group>
      <Text size="xs" c="dimmed" mb="xs">
        {runeword.sockets} sockets
      </Text>

      <Group gap={4} mb="sm">
        {runeword.items.map((code) => (
          <Badge key={code} variant="outline" color="gray" size="sm">
            {itemLabel(code)}
          </Badge>
        ))}
      </Group>

      <Stack gap={2}>
        {runeword.attributes.map((a, i) => {
          const highlighted = attributeFilters.some((af) => af.key && matchesAttribute(a, af))
          return (
            <Text
              key={i}
              size="sm"
              c={highlighted ? 'orange.3' : 'blue.2'}
              fw={highlighted ? 700 : 400}
            >
              {a.text}
            </Text>
          )
        })}
        {runeword.includesRuneMods &&
          (showRuneStats ? (
            <RuneStats runeword={runeword} />
          ) : (
            <Text size="xs" c="dimmed" fs="italic" mt={4}>
              + the mods from the runes
            </Text>
          ))}
      </Stack>
    </Card>
  )
}

function RuneStats({ runeword }: { runeword: Runeword }) {
  const slots = runewordSlots(runeword)
  return (
    <Stack gap="xs" mt="xs">
      {slots.map((slot) => (
        <Box key={slot}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={2}>
            Rune mods{slots.length > 1 ? ` in ${slotLabels[slot]}` : ''}
          </Text>
          {runeword.runes.map((name, i) => {
            const mods = runeByName.get(name)?.mods[slot] ?? []
            return (
              <Group key={i} gap={6} align="flex-start" wrap="nowrap">
                <Text size="xs" fw={700} w={40} style={{ flexShrink: 0 }}>
                  {name}
                </Text>
                <Text size="xs" c="gray.5">
                  {mods.length ? mods.join(' · ') : '—'}
                </Text>
              </Group>
            )
          })}
        </Box>
      ))}
    </Stack>
  )
}

export default function App() {
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState<SortKey>('level-asc')
  const [showRuneStats, setShowRuneStats] = useState(false)

  const results = useMemo(
    () => runewords.filter((r) => matches(r, filters)).sort(sorters[sort]),
    [filters, sort],
  )

  return (
    <Container size="xl" py="lg">
      <Title order={2} mb={4}>
        Chaos Empire Runewords
      </Title>
      <Text c="dimmed" mb="lg">
        All filters are combined with AND.
      </Text>

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Paper withBorder p="md" radius="md" style={{ position: 'sticky', top: 16 }}>
            <FilterPanel filters={filters} onChange={setFilters} />
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <Group justify="space-between" mb="md">
            <Text fw={500}>
              {results.length} of {runewords.length} runewords
            </Text>
            <Group gap="md">
              <Switch
                label="Show rune stats"
                checked={showRuneStats}
                onChange={(e) => setShowRuneStats(e.currentTarget.checked)}
              />
              <Select
                w={200}
                value={sort}
                onChange={(v) => v && setSort(v as SortKey)}
                allowDeselect={false}
                data={[
                  { value: 'level-asc', label: 'Level (low → high)' },
                  { value: 'level-desc', label: 'Level (high → low)' },
                  { value: 'name', label: 'Name' },
                ]}
              />
            </Group>
          </Group>

          {results.length === 0 ? (
            <Text c="dimmed">No runewords match all filters.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
              {results.map((r) => (
                <RunewordCard
                  key={r.name}
                  runeword={r}
                  attributeFilters={filters.attributes}
                  showRuneStats={showRuneStats}
                />
              ))}
            </SimpleGrid>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  )
}
