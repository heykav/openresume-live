import { describe, expect, it } from 'vitest'
import { DEFAULT_RESUME } from './resume'
import { safeLinkedInUrl, scoreResume } from './resume-score'

describe('resume score checklist', () => {
  it('uses a transparent 100-point checklist and gives full points to a complete draft', () => {
    const resume = structuredClone(DEFAULT_RESUME)
    resume.linkedin = 'https://www.linkedin.com/in/maya-chen'
    resume.experience[0].details += '\nImproved activation by 24%.'
    const result = scoreResume(resume)

    expect(result.criteria.reduce((sum, criterion) => sum + criterion.possible, 0)).toBe(100)
    expect(result.score).toBe(100)
    expect(result.criteria.every((criterion) => criterion.earned <= criterion.possible)).toBe(true)
  })

  it('deducts points for missing profile details, outcomes, education, and skills', () => {
    const resume = structuredClone(DEFAULT_RESUME)
    resume.name = ''
    resume.title = ''
    resume.email = 'not-an-email'
    resume.location = ''
    resume.experience = [{ ...resume.experience[0], role: '', company: '', dates: '', details: '' }]
    resume.education = []
    resume.skills = []

    const result = scoreResume(resume)
    expect(result.score).toBeLessThan(60)
    expect(result.criteria.filter((criterion) => criterion.earned < criterion.possible).length).toBeGreaterThan(5)
  })

  it('only treats secure LinkedIn profile URLs as safe external links', () => {
    expect(safeLinkedInUrl('https://www.linkedin.com/in/person')).toBe('https://www.linkedin.com/in/person')
    expect(safeLinkedInUrl('http://www.linkedin.com/in/person')).toBeNull()
    expect(safeLinkedInUrl('https://linkedin.com.evil.example/in/person')).toBeNull()
    expect(safeLinkedInUrl('javascript:alert(1)')).toBeNull()
  })
})
