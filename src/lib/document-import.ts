import { DEFAULT_RESUME, type EducationEntry, type ExperienceEntry, type Resume } from './resume'

const MAX_FILE_SIZE = 10_000_000
const MAX_PDF_PAGES = 20

const cleanLines = (text: string): string[] => text
  .replace(/\r/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .split('\n')
  .map((line) => line.replace(/^[\s•●▪◦*-]+/, '').trim())
  .filter(Boolean)

const sectionForHeading = (line: string): 'summary' | 'experience' | 'education' | 'skills' | null => {
  const heading = line.toLowerCase().replace(/[:\s]+$/, '')
  if (/^(summary|profile|about(?: me)?|professional summary|objective)$/.test(heading)) return 'summary'
  if (/^(experience|work experience|employment|professional experience|career history)$/.test(heading)) return 'experience'
  if (/^(education|academic background|qualifications)$/.test(heading)) return 'education'
  if (/^(skills|core skills|technical skills|competencies)$/.test(heading)) return 'skills'
  return null
}

const isContactOrHeading = (line: string): boolean => Boolean(
  sectionForHeading(line) ||
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(line) ||
  /(?:linkedin\.com|https?:\/\/|www\.)/i.test(line) ||
  /^\+?[\d ()-]{7,}$/.test(line),
)

const makeId = (prefix: string, index: number): string => `${prefix}-import-${index + 1}`

export function mapResumeTextToDraft(text: string): Resume {
  const lines = cleanLines(text)
  const sections: Record<'summary' | 'experience' | 'education' | 'skills', string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
  }
  const unsectioned: string[] = []
  let activeSection: keyof typeof sections | null = null

  for (const line of lines) {
    const nextSection = sectionForHeading(line)
    if (nextSection) {
      activeSection = nextSection
      continue
    }
    if (activeSection) sections[activeSection].push(line)
    else unsectioned.push(line)
  }

  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? ''
  const linkedin = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:in|pub)\/[^\s,;]+/i)?.[0]?.replace(/[).]+$/, '') ?? ''
  const website = Array.from(text.matchAll(/https?:\/\/(?:www\.)?[\w.-]+\.[A-Za-z]{2,}(?:\/[^\s,;]*)?/gi))
    .map((match) => match[0].replace(/[).,]+$/, ''))
    .find((url) => !/linkedin\.com/i.test(url)) ?? ''
  const contactLines = new Set(lines.filter(isContactOrHeading))
  const identityLines = unsectioned.filter((line) => !contactLines.has(line))
  const name = identityLines[0] ?? ''
  const title = identityLines[1] ?? ''
  const location = unsectioned.find((line) => /\b(remote|hybrid|[A-Z][a-z]+,\s*[A-Z]{2})\b/.test(line) && line !== name && line !== title) ?? ''

  const experienceLines = sections.experience
  const experienceDates = experienceLines.find((line) => /\b(?:19|20)\d{2}\b/.test(line)) ?? ''
  const experienceEntry: ExperienceEntry = {
    ...DEFAULT_RESUME.experience[0],
    id: makeId('experience', 0),
    role: experienceLines[0] ?? '',
    company: experienceLines[1] ?? '',
    dates: experienceDates,
    details: experienceLines.filter((line, index) => index > 1 && line !== experienceDates).join('\n'),
  }
  const educationLines = sections.education
  const educationEntry: EducationEntry = {
    ...DEFAULT_RESUME.education[0],
    id: makeId('education', 0),
    school: educationLines[0] ?? '',
    degree: educationLines[1] ?? '',
    dates: educationLines.find((line) => /\b(?:19|20)\d{2}\b/.test(line)) ?? '',
  }
  const skills = sections.skills
    .flatMap((line) => line.split(/[,;|•·]/))
    .map((skill) => skill.trim())
    .filter(Boolean)

  return {
    ...DEFAULT_RESUME,
    name,
    title,
    location,
    email,
    website,
    linkedin,
    about: sections.summary.join(' '),
    experience: experienceLines.length ? [experienceEntry] : [],
    education: educationLines.length ? [educationEntry] : [],
    skills,
  }
}

export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error('Choose a resume smaller than 10 MB.')
  const extension = file.name.toLowerCase().split('.').pop()

  if (extension === 'pdf' || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
    const document = await loadingTask.promise
    if (document.numPages > MAX_PDF_PAGES) {
      await loadingTask.destroy()
      throw new Error(`This PDF has ${document.numPages} pages. Choose a resume with ${MAX_PDF_PAGES} pages or fewer.`)
    }
    try {
      const pages: string[] = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        pages.push(content.items.map((item) => 'str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : '').join('').replace(/ +\n/g, '\n'))
      }
      const extracted = pages.join('\n')
      if (!extracted.trim()) throw new Error('No selectable text was found. Scanned-image PDFs are not supported.')
      return extracted
    } finally {
      await loadingTask.destroy()
    }
  }

  if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    if (!result.value.trim()) throw new Error('No readable text was found in this Word document.')
    return result.value
  }

  throw new Error('Choose a PDF or DOCX resume. Files are read in this browser and are never uploaded.')
}
