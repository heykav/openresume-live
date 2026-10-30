import { describe, expect, it } from 'vitest'
import { extractResumeText, mapResumeTextToDraft } from './document-import'

describe('resume document mapping', () => {
  it('maps recognizable headings and contact details into an editable draft', () => {
    const draft = mapResumeTextToDraft(`Avery Brooks
Product engineer
Toronto, Canada
avery@example.com
https://www.linkedin.com/in/avery-brooks

SUMMARY
I build reliable, accessible tools for teams and make complicated workflows easier to use.

EXPERIENCE
Senior Engineer
Northstar Labs
2021 - 2025
Improved task completion by 32%.
Led a team of four engineers.

EDUCATION
Northstar University
BS, Computer Science
2017 - 2021

SKILLS
TypeScript, Accessibility, Testing, React`)

    expect(draft.name).toBe('Avery Brooks')
    expect(draft.title).toBe('Product engineer')
    expect(draft.email).toBe('avery@example.com')
    expect(draft.linkedin).toBe('https://www.linkedin.com/in/avery-brooks')
    expect(draft.about).toContain('I build reliable, accessible tools')
    expect(draft.experience[0]).toMatchObject({
      role: 'Senior Engineer',
      company: 'Northstar Labs',
      dates: '2021 - 2025',
    })
    expect(draft.experience[0].details).toContain('Improved task completion by 32%.')
    expect(draft.education[0]).toMatchObject({ school: 'Northstar University', degree: 'BS, Computer Science' })
    expect(draft.skills).toEqual(['TypeScript', 'Accessibility', 'Testing', 'React'])
  })

  it('does not invent content when the imported text has no recognizable resume sections', () => {
    const draft = mapResumeTextToDraft('Avery Brooks\nProduct engineer\navery@example.com')
    expect(draft.name).toBe('Avery Brooks')
    expect(draft.title).toBe('Product engineer')
    expect(draft.experience).toEqual([])
    expect(draft.education).toEqual([])
    expect(draft.skills).toEqual([])
  })

  it('rejects unsupported and oversized files before parsing', async () => {
    await expect(extractResumeText(new File(['content'], 'resume.txt', { type: 'text/plain' })))
      .rejects.toThrow('Choose a PDF or DOCX resume.')
    await expect(extractResumeText(new File([new Uint8Array(10_000_001)], 'large.pdf', { type: 'application/pdf' })))
      .rejects.toThrow('Choose a resume smaller than 10 MB.')
  })
})
