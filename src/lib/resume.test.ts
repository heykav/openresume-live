import { describe, expect, it } from 'vitest'
import { DEFAULT_RESUME, parseResumeJson, readResume, saveResume, STORAGE_KEY } from './resume'

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

function legacyDraft(): Record<string, unknown> {
  const draft: Record<string, unknown> = JSON.parse(JSON.stringify(DEFAULT_RESUME))
  delete draft.linkedin
  return draft
}

describe('resume draft storage', () => {
  it('validates imported JSON drafts before returning resume data', () => {
    expect(parseResumeJson(JSON.stringify(DEFAULT_RESUME))).toEqual(DEFAULT_RESUME)
    expect(parseResumeJson(JSON.stringify(legacyDraft()))).toEqual(DEFAULT_RESUME)
    expect(() => parseResumeJson('{broken')).toThrow('The selected file is not valid JSON. Choose an OpenResume JSON backup.')
    expect(() => parseResumeJson(JSON.stringify({ name: 'Incomplete draft' })))
      .toThrow('The selected file is not a valid OpenResume draft. Choose a JSON backup exported from OpenResume.')
  })

  it('migrates older saved drafts that do not yet have a LinkedIn field', () => {
    const saved = readResume(createStorage({ [STORAGE_KEY]: JSON.stringify(legacyDraft()) }))
    expect(saved).toEqual({ resume: DEFAULT_RESUME, status: 'saved' })
  })

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
