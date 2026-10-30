import { describe, expect, it } from 'vitest'
import { DEFAULT_RESUME, readResume, saveResume, STORAGE_KEY } from './resume'

function createStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => { values.delete(key) },
    clear: () => { values.clear() },
    key: (index) => Array.from(values.keys())[index] ?? null,
    get length() { return values.size },
  }
}

describe('resume draft storage', () => {
  it('starts with an independent sample draft when no saved content exists', () => {
    const first = readResume(createStorage())
    const second = readResume(createStorage())

    expect(first.status).toBe('sample')
    expect(first.resume).toEqual(DEFAULT_RESUME)
    first.resume.name = 'Changed locally'
    expect(second.resume.name).toBe(DEFAULT_RESUME.name)
  })

  it('saves and restores the complete edited resume', () => {
    const storage = createStorage()
    const draft = structuredClone(DEFAULT_RESUME)
    draft.name = 'Jordan Rivera'
    draft.experience[0].details = 'A new highlight'

    saveResume(draft, storage)

    expect(storage.getItem(STORAGE_KEY)).toContain('Jordan Rivera')
    expect(readResume(storage)).toEqual({ resume: draft, status: 'saved' })
  })

  it('recovers from malformed or outdated saved content', () => {
    const storage = createStorage({ [STORAGE_KEY]: '{not valid json' })
    const recovered = readResume(storage)

    expect(recovered.status).toBe('recovered')
    expect(recovered.resume).toEqual(DEFAULT_RESUME)
  })

  it('reports blocked storage and failed saves explicitly', () => {
    expect(readResume({ ...createStorage(), getItem: () => { throw new Error('blocked') } }).status).toBe('recovered')
    expect(() => saveResume(DEFAULT_RESUME, { ...createStorage(), setItem: () => { throw new Error('blocked') } }))
      .toThrow('Could not save your draft on this device.')
  })
})
