import type { Resume } from './resume'

export type ResumeScoreSection = 'profile' | 'experience' | 'education' | 'skills'

export interface ResumeScoreCriterion {
  id: string
  label: string
  section: ResumeScoreSection
  earned: number
  possible: number
  tip: string
}

export interface ResumeScore {
  score: number
  criteria: ResumeScoreCriterion[]
}

export const safeLinkedInUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname) || !/^\/(in|pub)\//.test(url.pathname)) return null
    return url.href
  } catch {
    return null
  }
}

const hasValidWebsite = (value: string): boolean => {
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.')
  } catch {
    return false
  }
}

export function scoreResume(resume: Resume): ResumeScore {
  const experienceEntries = resume.experience.filter((entry) => entry.role.trim() || entry.company.trim() || entry.details.trim())
  const experience = experienceEntries.find((entry) => entry.role.trim() && entry.company.trim()) ?? experienceEntries[0]
  const educationEntries = resume.education.filter((entry) => entry.school.trim() || entry.degree.trim())
  const education = educationEntries.find((entry) => entry.school.trim() && entry.degree.trim()) ?? educationEntries[0]
  const hasExperienceDates = experienceEntries.some((entry) => entry.dates.trim())
  const hasWorkHighlights = experienceEntries.some((entry) => entry.details.trim())
  const hasMeasurableOutcome = experienceEntries.some((entry) => /\b\d+(?:[.,]\d+)?%?\b/.test(entry.details))
  const summaryLength = resume.about.trim().length
  const skillsCount = resume.skills.filter((skill) => skill.trim()).length
  const hasLink = hasValidWebsite(resume.website.trim()) || Boolean(safeLinkedInUrl(resume.linkedin))

  const criteria: ResumeScoreCriterion[] = [
    { id: 'name', label: 'Name', section: 'profile', earned: resume.name.trim() ? 5 : 0, possible: 5, tip: 'Add your name so people know whose work they are reading.' },
    { id: 'title', label: 'Professional title', section: 'profile', earned: resume.title.trim() ? 5 : 0, possible: 5, tip: 'Add a clear title that describes the work you do.' },
    { id: 'email', label: 'Contact email', section: 'profile', earned: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resume.email.trim()) ? 5 : 0, possible: 5, tip: 'Add a valid email address so people can reach you.' },
    { id: 'location', label: 'Location', section: 'profile', earned: resume.location.trim() ? 5 : 0, possible: 5, tip: 'Add a city, region, or remote-work preference.' },
    { id: 'summary', label: 'About you', section: 'profile', earned: summaryLength >= 80 ? 15 : summaryLength >= 20 ? 8 : 0, possible: 15, tip: 'Write a concise introduction of at least 80 characters for full points; a shorter introduction can earn half.' },
    { id: 'experience', label: 'Role and employer', section: 'experience', earned: experience?.role.trim() && experience.company.trim() ? 10 : experience?.role.trim() || experience?.company.trim() ? 5 : 0, possible: 10, tip: 'Include a role title and the organization for at least one experience.' },
    { id: 'dates', label: 'Experience dates', section: 'experience', earned: hasExperienceDates ? 5 : 0, possible: 5, tip: 'Add dates to give each role useful context.' },
    { id: 'highlights', label: 'Work highlights', section: 'experience', earned: hasWorkHighlights ? 10 : 0, possible: 10, tip: 'Add a specific contribution or outcome under a role.' },
    { id: 'outcomes', label: 'Measurable outcomes', section: 'experience', earned: hasMeasurableOutcome ? 15 : 0, possible: 15, tip: 'Where accurate, quantify an outcome with a number, percentage, time, or scale.' },
    { id: 'education', label: 'Education', section: 'education', earned: education?.school.trim() && education.degree.trim() ? 10 : education?.school.trim() || education?.degree.trim() ? 5 : 0, possible: 10, tip: 'Add an education entry with both institution and qualification.' },
    { id: 'skills', label: 'Skills', section: 'skills', earned: skillsCount >= 4 ? 10 : skillsCount >= 2 ? 7 : skillsCount === 1 ? 4 : 0, possible: 10, tip: 'List at least four relevant skills to make your strengths easy to scan.' },
    { id: 'links', label: 'Portfolio or LinkedIn link', section: 'profile', earned: hasLink ? 5 : 0, possible: 5, tip: 'Add a portfolio website or a valid LinkedIn profile URL.' },
  ]

  return {
    score: criteria.reduce((total, criterion) => total + criterion.earned, 0),
    criteria,
  }
}
