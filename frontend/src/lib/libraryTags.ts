type LibraryTagRecord = {
  owned?: boolean
  private?: boolean
}

type LibraryTagsStore = Record<string, LibraryTagRecord>

const STORAGE_KEY = 'treasurehouse.library.tags.v1'

const readStore = (): LibraryTagsStore => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.entries(parsed as Record<string, unknown>).reduce<LibraryTagsStore>((acc, [bookId, value]) => {
      if (!bookId || !value || typeof value !== 'object' || Array.isArray(value)) return acc
      const next: LibraryTagRecord = {
        owned: Boolean((value as { owned?: unknown }).owned),
        private: Boolean((value as { private?: unknown }).private),
      }
      if (next.owned || next.private) acc[bookId] = next
      return acc
    }, {})
  } catch {
    return {}
  }
}

const writeStore = (store: LibraryTagsStore) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const getLibraryTagsForBook = (bookId: string): LibraryTagRecord => {
  if (!bookId) return {}
  const store = readStore()
  return store[bookId] ?? {}
}

export const setLibraryTagForBook = (
  bookId: string,
  key: keyof LibraryTagRecord,
  enabled: boolean,
): LibraryTagRecord => {
  if (!bookId) return {}
  const store = readStore()
  const current = store[bookId] ?? {}
  const next = { ...current, [key]: enabled }

  if (!next.owned && !next.private) {
    delete store[bookId]
  } else {
    store[bookId] = next
  }

  writeStore(store)
  return store[bookId] ?? {}
}

export const getTaggedBookIds = (key: keyof LibraryTagRecord): string[] => {
  const store = readStore()
  return Object.entries(store)
    .filter(([, tags]) => Boolean(tags[key]))
    .map(([bookId]) => bookId)
}

