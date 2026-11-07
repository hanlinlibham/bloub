import { ref, watch, type Ref } from 'vue'

const PREFIX = 'abutton:'

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    /* private mode / quota: the preference just won't survive a reload */
  }
}

/** A preference that survives reloads. Unknown stored ids fall back to the default. */
export function persisted(key: string, fallback: string, valid: (v: string) => boolean): Ref<string> {
  const v = read(key)
  const r = ref(v && valid(v) ? v : fallback)
  watch(r, (n) => write(key, n))
  return r
}

export function persistedJson<T extends object>(key: string, fallback: T): Ref<T> {
  let initial = fallback
  const raw = read(key)
  if (raw) {
    try {
      initial = { ...fallback, ...(JSON.parse(raw) as Partial<T>) }
    } catch {
      initial = fallback
    }
  }
  const r = ref(initial) as Ref<T>
  watch(r, (n) => write(key, JSON.stringify(n)), { deep: true })
  return r
}
