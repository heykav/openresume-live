export interface ExperienceEntry {
  id: string
  role: string
  company: string
  dates: string
  location: string
  details: string
}

export interface EducationEntry {
  id: string
  school: string
  degree: string
  dates: string
}

export interface Resume {
  name: string
  title: string
  location: string
  email: string
  website: string
  about: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
}

export type DraftStatus = 'sample' | 'saved' | 'saving' | 'error' | 'unavailable' | 'recovered'

export const STORAGE_KEY = 'openresume-live:draft:v1'

export const DEFAULT_RESUME: Resume = {
  name: 'Maya Chen',
  title: 'Product designer',
  location: 'Brooklyn, New York',
  email: 'hello@mayachen.design',
  website: 'mayachen.design',
  about: 'I turn complex ideas into clear, thoughtful digital experiences. I care about good questions, useful details, and making technology feel a little more human.',
  experience: [
    {
      id: 'experience-1',
      role: 'Senior Product Designer',
      company: 'Fieldwork',
      dates: '2022 — now',
      location: 'New York, NY',
      details: 'Led product design across research, prototyping, and launch.\nBuilt a shared design system with product and engineering.\nMade everyday workflows easier to understand and use.',
    },
    {
      id: 'experience-2',
      role: 'Product Designer',
      company: 'Goodkind Studio',
      dates: '2019 — 2022',
      location: 'Brooklyn, NY',
      details: 'Partnered with early-stage teams to shape digital products.\nTurned customer interviews into clear product direction.',
    },
  ],
  education: [
    {
      id: 'education-1',
      school: 'Parsons School of Design',
      degree: 'BFA, Communication Design',
      dates: '2015 — 2019',
    },
  ],
  skills: ['Product strategy', 'Interaction design', 'Prototyping', 'Design systems', 'User research'],
}

export interface LoadedDraft {
  resume: Resume
  status: DraftStatus
}

const cloneDefault = (): Resume => JSON.parse(JSON.stringify(DEFAULT_RESUME)) as Resume
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'

function isResume(value: unknown): value is Resume {
  if (!isRecord(value)) return false
  const profileFields = ['name', 'title', 'location', 'email', 'website', 'about']
  if (!profileFields.every((field) => isString(value[field]))) return false
  if (!Array.isArray(value.experience) || !Array.isArray(value.education) || !Array.isArray(value.skills)) return false

  const validExperience = value.experience.every((entry: unknown) =>
    isRecord(entry) && ['id', 'role', 'company', 'dates', 'location', 'details'].every((field) => isString(entry[field])),
  )
  const validEducation = value.education.every((entry: unknown) =>
    isRecord(entry) && ['id', 'school', 'degree', 'dates'].every((field) => isString(entry[field])),
  )
  return validExperience && validEducation && value.skills.every(isString)
}

export function parseResumeJson(contents: string): Resume {
  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    throw new Error('The selected file is not valid JSON. Choose an OpenResume JSON backup.')
  }
  if (!isResume(parsed)) throw new Error('The selected file is not a valid OpenResume draft. Choose a JSON backup exported from OpenResume.')
  return parsed
}

export function readResume(storage?: Storage): LoadedDraft {
  let draftStorage: Storage | undefined
  try {
    draftStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
    if (!draftStorage) return { resume: cloneDefault(), status: 'unavailable' }
    const stored = draftStorage.getItem(STORAGE_KEY)
    if (!stored) return { resume: cloneDefault(), status: 'sample' }
    const parsed: unknown = JSON.parse(stored)
    return isResume(parsed)
      ? { resume: parsed, status: 'saved' }
      : { resume: cloneDefault(), status: 'recovered' }
  } catch {
    return { resume: cloneDefault(), status: draftStorage ? 'recovered' : 'unavailable' }
  }
}

export function saveResume(resume: Resume, storage?: Storage): void {
  try {
    const draftStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
    if (!draftStorage) throw new Error('Browser storage is not available.')
    draftStorage.setItem(STORAGE_KEY, JSON.stringify(resume))
  } catch (error) {
    throw new Error('Could not save your draft on this device.', { cause: error })
  }
}
