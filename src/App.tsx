import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import './App.css'
import { DEFAULT_RESUME, parseResumeJson, readResume, saveResume, type EducationEntry, type ExperienceEntry, type Resume } from './lib/resume'
import { extractResumeText, mapResumeTextToDraft } from './lib/document-import'
import { safeLinkedInUrl, scoreResume, type ResumeScoreSection } from './lib/resume-score'

type IconName = 'profile' | 'work' | 'school' | 'skills' | 'plus' | 'download' | 'print' | 'arrow' | 'chevron-up' | 'chevron-down' | 'close'
type SectionId = 'profile' | 'experience' | 'education' | 'skills'
type PreviewMode = 'portfolio' | 'resume'

const sections: { id: SectionId; label: string; icon: IconName }[] = [
  { id: 'profile', label: 'Profile', icon: 'profile' },
  { id: 'experience', label: 'Experience', icon: 'work' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
]

const iconShapes: Record<IconName, ReactNode> = {
  profile: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  school: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h7" /></>,
  skills: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
  print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconShapes[name]}
    </svg>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  name,
  autoComplete = 'off',
  spellCheck,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  name: string
  autoComplete?: string
  spellCheck?: boolean
  type?: 'text' | 'email' | 'url'
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input name={name} autoComplete={autoComplete} spellCheck={spellCheck} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  name,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  name: string
  rows?: number
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea name={name} autoComplete="off" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function SectionHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="section-heading"><div><h1>{title}</h1><p>{description}</p></div>{children}</div>
}

function ProfileEditor({ resume, update }: { resume: Resume; update: (key: keyof Omit<Resume, 'experience' | 'education' | 'skills'>, value: string) => void }) {
  return (
    <>
      <SectionHeading title="Your profile" description="Start with the details people should remember." />
      <div className="form-stack">
        <Field label="Full name" name="name" autoComplete="name" value={resume.name} onChange={(value) => update('name', value)} placeholder="Your name…" />
        <Field label="Professional title" name="job-title" autoComplete="organization-title" value={resume.title} onChange={(value) => update('title', value)} placeholder="e.g. Product designer…" />
        <div className="form-row">
          <Field label="Location" name="location" autoComplete="address-level2" value={resume.location} onChange={(value) => update('location', value)} placeholder="City, country…" />
          <Field label="Email" name="email" autoComplete="email" spellCheck={false} value={resume.email} onChange={(value) => update('email', value)} placeholder="you@example.com…" type="email" />
        </div>
        <Field label="Website" name="website" autoComplete="url" value={resume.website} onChange={(value) => update('website', value)} placeholder="yourwebsite.com…" type="url" />
        <Field label="LinkedIn profile" name="linkedin" autoComplete="url" value={resume.linkedin} onChange={(value) => update('linkedin', value)} placeholder="https://linkedin.com/in/you…" type="url" />
        <p className="field-hint">Add your profile link. OpenResume never signs in to or reads LinkedIn.</p>
        <TextArea label="About" name="about" value={resume.about} onChange={(value) => update('about', value)} placeholder="A short introduction, in your own words…" rows={5} />
        <p className="field-hint">Keep it human. A few clear sentences are plenty.</p>
      </div>
    </>
  )
}

function EntriesEditor({
  kind,
  entries,
  setResume,
}: {
  kind: 'experience' | 'education'
  entries: ExperienceEntry[] | EducationEntry[]
  setResume: Dispatch<SetStateAction<Resume>>
}) {
  const isExperience = kind === 'experience'
  const label = isExperience ? 'Experience' : 'Education'
  const singular = isExperience ? 'role' : 'school'
  const fields: [string, string, string][] = isExperience
    ? [['role', 'Position', 'e.g. Senior product designer'], ['company', 'Company', 'Company name'], ['dates', 'Dates', '2022 — now'], ['location', 'Location', 'City or remote']]
    : [['school', 'School', 'School or university'], ['degree', 'Degree or program', 'e.g. BFA, Interaction Design'], ['dates', 'Dates', '2016 — 2020']]

  const updateEntry = (index: number, field: string, value: string) => {
    setResume((current) => ({
      ...current,
      [kind]: current[kind].map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
    }))
  }
  const addEntry = () => {
    const blank: ExperienceEntry | EducationEntry = isExperience
      ? { id: makeId(), role: '', company: '', dates: '', location: '', details: '' }
      : { id: makeId(), school: '', degree: '', dates: '' }
    setResume((current) => ({ ...current, [kind]: [...current[kind], blank] } as Resume))
  }
  const removeEntry = (id: string) => {
    setResume((current) => ({ ...current, [kind]: current[kind].filter((entry) => entry.id !== id) }))
  }
  const moveEntry = (id: string, direction: -1 | 1) => {
    setResume((current) => {
      const entries = [...current[kind]]
      const index = entries.findIndex((entry) => entry.id === id)
      const targetIndex = index + direction
      if (index < 0 || targetIndex < 0 || targetIndex >= entries.length) return current
      ;[entries[index], entries[targetIndex]] = [entries[targetIndex], entries[index]]
      return { ...current, [kind]: entries } as Resume
    })
  }

  return (
    <>
      <SectionHeading title={label} description={isExperience ? 'Show the work, not just the job title.' : 'Add the learning that shaped your work.'}>
        <button className="button button-outline button-small" type="button" onClick={addEntry}><Icon name="plus" size={16} />Add {singular}</button>
      </SectionHeading>
      {entries.length ? (
        <div className="entry-list">
          {entries.map((entry, index) => {
            const entryName = ('role' in entry ? entry.role : entry.school) || `New ${singular}`
            return (
              <section className="entry-editor" key={entry.id}>
                <div className="entry-editor-heading">
                  <span className="entry-index">{String(index + 1).padStart(2, '0')}</span>
                  <span>{entryName}</span>
                  <div className="entry-actions">
                    <button className="icon-button" type="button" aria-label={`Move ${entryName} up`} onClick={() => moveEntry(entry.id, -1)} disabled={index === 0}><Icon name="chevron-up" size={16} /></button>
                    <button className="icon-button" type="button" aria-label={`Move ${entryName} down`} onClick={() => moveEntry(entry.id, 1)} disabled={index === entries.length - 1}><Icon name="chevron-down" size={16} /></button>
                    <button className="icon-button remove-button" type="button" aria-label={`Remove ${entryName}`} onClick={() => removeEntry(entry.id)}><Icon name="close" size={17} /></button>
                  </div>
                </div>
                <div className="form-stack">
                  {fields.map(([key, fieldLabel, placeholder]) => {
                    const value = (entry as unknown as Record<string, string>)[key] ?? ''
                    return <Field key={key} label={fieldLabel} name={`${kind}-${entry.id}-${key}`} value={value} onChange={(next) => updateEntry(index, key, next)} placeholder={`${placeholder}…`} />
                  })}
                  {isExperience && 'details' in entry && <TextArea label="Highlights" name={`${kind}-${entry.id}-details`} value={entry.details} onChange={(value) => updateEntry(index, 'details', value)} placeholder="One highlight per line…" rows={4} />}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="empty-editor">
          <span className="empty-mark">+</span>
          <h2>{isExperience ? 'Make room for good work.' : 'Every path starts somewhere.'}</h2>
          <p>{isExperience ? 'Add a role to begin building your experience.' : 'Add a school, course, or program that matters to you.'}</p>
          <button className="button button-primary" type="button" onClick={addEntry}><Icon name="plus" size={16} />Add {isExperience ? 'your first role' : 'education'}</button>
        </div>
      )}
    </>
  )
}

function SkillsEditor({ skills, setResume }: { skills: string[]; setResume: Dispatch<SetStateAction<Resume>> }) {
  const [draft, setDraft] = useState(skills.join(', '))
  useEffect(() => setDraft(skills.join(', ')), [skills])
  const update = (value: string) => {
    setDraft(value)
    setResume((current) => ({ ...current, skills: value.split(',').map((skill) => skill.trim()).filter(Boolean) }))
  }
  return (
    <>
      <SectionHeading title="Skills" description="Choose a few strengths you want to be known for." />
      <div className="form-stack">
        <TextArea label="Your skills" name="skills" value={draft} onChange={update} placeholder="Research, prototyping, facilitation…" rows={5} />
        <p className="field-hint">Separate each skill with a comma. They’ll appear as a tidy list in your preview.</p>
        <div className="skill-preview"><span className="field-label">IN YOUR PREVIEW</span><div className="skill-list">{skills.length ? skills.map((skill, index) => <span className="skill-chip" key={`${skill}-${index}`}>{skill}</span>) : <span className="muted-copy">Your skills will appear here.</span>}</div></div>
      </div>
    </>
  )
}

function ResumePreview({ resume, onEdit }: { resume: Resume; onEdit: (section: SectionId) => void }) {
  const experience = resume.experience.filter((entry) => entry.role || entry.company || entry.details)
  const education = resume.education.filter((entry) => entry.school || entry.degree)
  const linkedin = safeLinkedInUrl(resume.linkedin)
  return (
    <article className="portfolio-page resume-page">
      <header className="resume-header">
        <div><h2>{resume.name || 'Your name'}</h2><p>{resume.title || 'Your professional title'}</p></div>
        <div className="resume-contact">{[resume.email, resume.location, resume.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}{linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}</div>
      </header>
      {resume.about && <section className="resume-section"><div className="resume-section-heading"><h3>Profile</h3><button className="preview-edit-link" type="button" aria-label="Edit profile" onClick={() => onEdit('profile')}>Edit</button></div><p>{resume.about}</p></section>}
      {experience.length > 0 && <section className="resume-section"><div className="resume-section-heading"><h3>Experience</h3><button className="preview-edit-link" type="button" aria-label="Edit experience" onClick={() => onEdit('experience')}>Edit</button></div>{experience.map((entry) => <div className="resume-entry" key={entry.id}><div className="resume-entry-top"><h4>{entry.role || entry.company}</h4><span>{entry.dates}</span></div><p className="resume-entry-sub">{[entry.company, entry.location].filter(Boolean).join(' · ')}</p>{entry.details && <ul>{entry.details.split('\n').filter(Boolean).map((line, index) => <li key={`${entry.id}-${index}`}>{line}</li>)}</ul>}</div>)}</section>}
      {education.length > 0 && <section className="resume-section"><div className="resume-section-heading"><h3>Education</h3><button className="preview-edit-link" type="button" aria-label="Edit education" onClick={() => onEdit('education')}>Edit</button></div>{education.map((entry) => <div className="resume-entry resume-education" key={entry.id}><div className="resume-entry-top"><h4>{entry.school}</h4><span>{entry.dates}</span></div><p className="resume-entry-sub">{entry.degree}</p></div>)}</section>}
      {resume.skills.length > 0 && <section className="resume-section"><div className="resume-section-heading"><h3>Skills</h3><button className="preview-edit-link" type="button" aria-label="Edit skills" onClick={() => onEdit('skills')}>Edit</button></div><p>{resume.skills.join(' · ')}</p></section>}
    </article>
  )
}

function PortfolioPreview({ resume, onEdit }: { resume: Resume; onEdit: (section: SectionId) => void }) {
  const experience = resume.experience.filter((entry) => entry.role || entry.company || entry.details)
  const initials = resume.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'YO'
  const linkedin = safeLinkedInUrl(resume.linkedin)
  return (
    <article className="portfolio-page site-page">
      <header className="site-header"><span className="site-mark">{initials}</span><nav aria-label="Portfolio navigation"><button type="button" onClick={() => onEdit('experience')}>Work</button><button type="button" onClick={() => onEdit('profile')}>About</button>{resume.email && <button type="button" onClick={() => onEdit('profile')}>Contact</button>}</nav></header>
      <section className="site-hero">
        <div className="site-hero-content"><span className="site-overline">{resume.location || 'Independent creative'}</span><h2>{resume.name || 'Your name'}<span>.</span></h2><p>{resume.title || 'Your professional title'}</p></div>
        <span className="hero-coordinate">PORTFOLIO / {new Date().getFullYear()}</span>
      </section>
      <section className="site-intro"><div className="site-section-label"><span className="site-label">A LITTLE ABOUT ME</span><button className="preview-edit-link" type="button" aria-label="Edit profile" onClick={() => onEdit('profile')}>Edit</button></div><p>{resume.about || 'Add a few sentences about what you do and what you care about.'}</p></section>
      {experience.length > 0 && <section className="site-work"><div className="site-section-heading"><span className="site-label">SELECTED EXPERIENCE</span><div className="site-section-actions"><span className="site-count">{String(experience.length).padStart(2, '0')} ENTRIES</span><button className="preview-edit-link" type="button" aria-label="Edit experience" onClick={() => onEdit('experience')}>Edit</button></div></div>{experience.map((entry, index) => <article className="site-work-item" key={entry.id}><span className="work-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{entry.role || entry.company}</h3><p>{entry.company}{entry.location ? ` · ${entry.location}` : ''}</p>{entry.details && <p className="work-detail">{entry.details.split('\n').filter(Boolean)[0]}</p>}</div><span className="work-dates">{entry.dates}</span></article>)}</section>}
      {resume.skills.length > 0 && <section className="site-skills"><div className="site-section-label"><span className="site-label">GOOD AT</span><button className="preview-edit-link" type="button" aria-label="Edit skills" onClick={() => onEdit('skills')}>Edit</button></div><div className="site-skill-list">{resume.skills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>)}</div></section>}
      <footer className="site-footer">{resume.email ? <span>{resume.email}</span> : <span>Add your email to make it easy to get in touch.</span>}{linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn profile</a>}<span>Made with OpenResume by <a href="https://krishnaanubhav.com">Krishna Anubhav</a></span></footer>
    </article>
  )
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sectionHasContent(resume: Resume, section: SectionId): boolean {
  if (section === 'profile') return [resume.name, resume.title, resume.location, resume.email, resume.website, resume.linkedin, resume.about].some((value) => value.trim())
  if (section === 'experience') return resume.experience.some((entry) => Object.entries(entry).some(([key, value]) => key !== 'id' && value.trim()))
  if (section === 'education') return resume.education.some((entry) => Object.entries(entry).some(([key, value]) => key !== 'id' && value.trim()))
  return resume.skills.some((skill) => skill.trim())
}

interface ImportReview {
  resume: Resume
  sourceName: string
  extractedText: string | null
}

function App() {
  const [loadedDraft] = useState(() => readResume())
  const [resume, setResume] = useState(loadedDraft.resume)
  const [saveState, setSaveState] = useState(loadedDraft.status)
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [activeView, setActiveView] = useState<PreviewMode>('portfolio')
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const previousResume = useRef(resume)
  const resumeRef = useRef(resume)
  const pendingSave = useRef<number | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const importButton = useRef<HTMLButtonElement>(null)
  const importReviewPanel = useRef<HTMLElement>(null)
  const wasReviewingImport = useRef(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importReview, setImportReview] = useState<ImportReview | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const resumeScore = scoreResume(resume)
  const startedSections = sections.filter(({ id }) => sectionHasContent(resume, id))
  resumeRef.current = resume

  useEffect(() => {
    if (importReview && !wasReviewingImport.current) {
      wasReviewingImport.current = true
      importReviewPanel.current?.focus()
    } else if (!importReview && wasReviewingImport.current) {
      wasReviewingImport.current = false
      importButton.current?.focus()
    }
  }, [importReview])

  useEffect(() => {
    if (previousResume.current === resume) return
    previousResume.current = resume
    if (saveState === 'unavailable') return
    setSaveState('saving')
    pendingSave.current = window.setTimeout(() => {
      pendingSave.current = null
      try {
        saveResume(resume)
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 350)
    return () => {
      if (pendingSave.current !== null) window.clearTimeout(pendingSave.current)
      pendingSave.current = null
    }
  }, [resume])

  useEffect(() => {
    const flushPendingSave = () => {
      if (pendingSave.current === null) return
      if (pendingSave.current !== null) window.clearTimeout(pendingSave.current)
      pendingSave.current = null
      if (loadedDraft.status === 'unavailable') return
      try {
        saveResume(resumeRef.current)
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }
    window.addEventListener('pagehide', flushPendingSave)
    return () => window.removeEventListener('pagehide', flushPendingSave)
  }, [loadedDraft.status])

  const updateProfile = (key: keyof Omit<Resume, 'experience' | 'education' | 'skills'>, value: string) => {
    setResume((current) => ({ ...current, [key]: value }))
  }

  const editSection = (section: SectionId) => {
    setActiveSection(section)
    setMobilePane('edit')
  }

  const restoreSample = () => {
    if (window.confirm('Replace your current draft with the sample profile? This cannot be undone.')) {
      setResume(JSON.parse(JSON.stringify(DEFAULT_RESUME)) as Resume)
      setActiveSection('profile')
    }
  }

  const downloadDraft = () => {
    const file = new Blob([`${JSON.stringify(resume, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'openresume-draft.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setImportMessage(null)
    setIsImporting(true)
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        if (file.size > 5_000_000) throw new Error('Choose a draft file smaller than 5 MB.')
        setImportReview({ resume: parseResumeJson(await file.text()), sourceName: file.name, extractedText: null })
      } else {
        const extractedText = await extractResumeText(file)
        setImportReview({ resume: mapResumeTextToDraft(extractedText), sourceName: file.name, extractedText })
      }
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Could not read the selected file.')
    } finally {
      setIsImporting(false)
      input.value = ''
    }
  }

  const confirmImport = () => {
    if (!importReview) return
    setResume(importReview.resume)
    setActiveSection('profile')
    setMobilePane('edit')
    setImportReview(null)
    setImportMessage(null)
  }

  const updateImportProfile = (key: keyof Omit<Resume, 'experience' | 'education' | 'skills'>, value: string) => {
    setImportReview((current) => current ? { ...current, resume: { ...current.resume, [key]: value } } : current)
  }

  const updateImportExperience = (index: number, key: keyof ExperienceEntry, value: string) => {
    setImportReview((current) => current ? {
      ...current,
      resume: { ...current.resume, experience: current.resume.experience.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry) },
    } : current)
  }

  const updateImportEducation = (index: number, key: keyof EducationEntry, value: string) => {
    setImportReview((current) => current ? {
      ...current,
      resume: { ...current.resume, education: current.resume.education.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry) },
    } : current)
  }

  const updateImportSkills = (value: string) => {
    setImportReview((current) => current ? {
      ...current,
      resume: { ...current.resume, skills: value.split(',').map((skill) => skill.trim()).filter(Boolean) },
    } : current)
  }

  const goToScoreSection = (section: ResumeScoreSection) => {
    setActiveSection(section)
    setMobilePane('edit')
  }

  const printResume = () => {
    setActiveView('resume')
    window.setTimeout(() => window.print(), 100)
  }

  const saveLabel = saveState === 'saving' ? 'Saving draft' : saveState === 'error'
    ? 'Couldn’t save draft' : saveState === 'recovered' ? 'Saved draft unreadable — sample loaded'
      : saveState === 'unavailable' ? 'Local storage unavailable'
        : saveState === 'sample' ? 'Sample profile'
          : 'Saved on this device'

  return (
    <>
    <div className="app-shell" inert={importReview !== null}>
      <a className="skip-link" href="#resume-editor">Skip to editor</a>
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="OpenResume home"><span className="brand-symbol">o</span><span>openresume<span className="brand-period">.</span></span><span className="brand-live">LIVE</span></a>
        <div className="topbar-right">
          <span className={`save-indicator ${saveState}`} role="status" aria-live="polite"><span className="save-dot" />{saveLabel}</span>
          <span className="topbar-divider" />
          <button className="button button-quiet top-action mobile-export" type="button" aria-label="Export draft" onClick={downloadDraft}><Icon name="download" size={17} /><span>Export draft</span></button>
          <button className="button button-primary top-action" type="button" onClick={printResume}><Icon name="print" size={17} /><span>Save as PDF</span></button>
          <button className="mobile-pane-toggle" type="button" onClick={() => setMobilePane((current) => current === 'edit' ? 'preview' : 'edit')}>{mobilePane === 'edit' ? 'See preview' : 'Back to editing'}<Icon name="arrow" size={16} /></button>
        </div>
      </header>
      <div className="workspace">
        <aside className={`section-rail ${mobilePane === 'preview' ? 'mobile-hidden' : ''}`} aria-label="Resume sections">
          <div className="rail-heading"><span>YOUR RESUME</span><span className="sample-tag">{saveState === 'sample' || saveState === 'recovered' ? 'SAMPLE' : 'DRAFT'}</span></div>
          <div className="section-coverage">
            <div className="coverage-heading"><span>SECTIONS WITH CONTENT</span><strong>{startedSections.length}<span> / {sections.length}</span></strong></div>
            <div className="coverage-track" role="progressbar" aria-label="Resume sections with content" aria-valuemin={0} aria-valuemax={sections.length} aria-valuenow={startedSections.length} aria-valuetext={`${startedSections.length} of ${sections.length} sections have content`}><span style={{ transform: `scaleX(${startedSections.length / sections.length})` }} /></div>
            <p>{startedSections.length === sections.length ? 'Every section has a starting point.' : `${sections.length - startedSections.length} ${sections.length - startedSections.length === 1 ? 'section needs' : 'sections need'} a starting point.`}</p>
          </div>
          <details className="resume-score">
            <summary><span><strong>Resume score</strong><small>Completeness checklist</small></span><b>{resumeScore.score}<i>/100</i></b></summary>
            <div className="score-meter" role="progressbar" aria-label="Resume completeness score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={resumeScore.score}><span style={{ transform: `scaleX(${resumeScore.score / 100})` }} /></div>
            <p className="score-disclaimer">A writing checklist, not an ATS, hiring, or job-fit prediction.</p>
            <div className="score-criteria">{resumeScore.criteria.map((criterion) => <button key={criterion.id} type="button" className={`score-criterion ${criterion.earned === criterion.possible ? 'complete' : ''}`} onClick={() => goToScoreSection(criterion.section)}><span><strong>{criterion.label}</strong><small>{criterion.earned === criterion.possible ? 'Looking good' : criterion.tip}</small></span><b>{criterion.earned}<i>/{criterion.possible}</i></b></button>)}</div>
          </details>
          <nav className="section-nav" aria-label="Edit resume section">{sections.map((section, index) => {
            const started = startedSections.some(({ id }) => id === section.id)
            return <button className={`section-nav-item ${activeSection === section.id ? 'active' : ''}`} type="button" key={section.id} onClick={() => setActiveSection(section.id)} aria-label={`${section.label}, ${started ? 'has content' : 'empty'}`} aria-current={activeSection === section.id ? 'step' : undefined}><span className="nav-icon"><Icon name={section.icon} size={17} /></span><span className="nav-label">{section.label}</span><span className={`nav-status ${started ? 'started' : ''}`} aria-hidden="true">{started ? '•' : '—'}</span><span className="nav-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></button>
          })}</nav>
          <div className="rail-bottom">
            <div className="privacy-note"><span className="privacy-lock" aria-hidden="true">⌑</span><div><strong>Your draft stays yours.</strong><span>Your content stays in this browser.</span></div></div>
            <div className="rail-actions">
              <button ref={importButton} className="rail-action" type="button" disabled={isImporting} onClick={() => importInput.current?.click()}>{isImporting ? 'Reading resume…' : 'Import resume'}</button>
              <button className="rail-action restore-button" type="button" onClick={restoreSample}>Restore sample content</button>
            </div>
            <p className="import-hint">PDF, DOCX, or OpenResume JSON · processed on this device</p>
            <input ref={importInput} className="visually-hidden" type="file" accept=".pdf,.docx,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json" aria-hidden="true" tabIndex={-1} onChange={importDraft} />
            {importMessage && <p className="import-error" role="alert">{importMessage}</p>}
          </div>
        </aside>
        <main id="resume-editor" tabIndex={-1} className={`editor-panel ${mobilePane === 'preview' ? 'mobile-hidden' : ''}`}>
          <div className="editor-topline"><span>EDITING / <strong>{sections.find((section) => section.id === activeSection)?.label.toUpperCase()}</strong></span><span className="edit-live"><span /> LIVE</span></div>
          <div className="editor-scroll" key={activeSection}>
            {activeSection === 'profile' && <ProfileEditor resume={resume} update={updateProfile} />}
            {activeSection === 'experience' && <EntriesEditor kind="experience" entries={resume.experience} setResume={setResume} />}
            {activeSection === 'education' && <EntriesEditor kind="education" entries={resume.education} setResume={setResume} />}
            {activeSection === 'skills' && <SkillsEditor skills={resume.skills} setResume={setResume} />}
            <div className="editor-bottom-note"><span className="note-line" /><p>Every change finds its way to the page.</p></div>
          </div>
        </main>
        <section className={`preview-panel ${mobilePane === 'edit' ? 'mobile-hidden' : ''}`} aria-label="Live preview">
          <div className="preview-toolbar"><div className="preview-heading"><span className="preview-live-mark"><span /></span><span>LIVE PREVIEW</span><span className="preview-separator">/</span><span className="preview-device">WEB</span></div><div className="preview-toolbar-actions"><div className="preview-controls" role="group" aria-label="Preview format"><button className={activeView === 'portfolio' ? 'selected' : ''} type="button" aria-pressed={activeView === 'portfolio'} onClick={() => setActiveView('portfolio')}>Portfolio</button><button className={activeView === 'resume' ? 'selected' : ''} type="button" aria-pressed={activeView === 'resume'} onClick={() => setActiveView('resume')}>Resume</button></div><button className="mobile-print" type="button" onClick={printResume}><Icon name="print" size={15} /><span>PDF</span></button></div></div>
          <div className="preview-canvas"><div className="preview-page-label"><span>{activeView === 'portfolio' ? 'PERSONAL SITE' : 'RESUME FORMAT'}</span><span className="page-status"><span /> UP TO DATE</span></div><div className="preview-scroll" key={activeView}>{activeView === 'portfolio' ? <PortfolioPreview resume={resume} onEdit={editSection} /> : <ResumePreview resume={resume} onEdit={editSection} />}</div></div>
          <div className="preview-footnote"><span aria-hidden="true">↳</span> {saveState === 'sample' ? 'This is a sample profile. Make it yours as you edit.' : 'Your content stays on this device.'}</div>
        </section>
      </div>
    </div>
      {importReview && <div className="review-overlay"><section ref={importReviewPanel} className="import-review" role="dialog" aria-modal="true" aria-labelledby="import-review-title" tabIndex={-1} onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          setImportReview(null)
        } else if (event.key === 'Tab') {
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex="-1"])'))
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }
      }}>
        <h2 id="import-review-title">Review before replacing</h2>
        <p className="review-source">{importReview.sourceName} · Edit detected fields below; your current draft stays unchanged until you confirm.</p>
        <div className="import-review-fields">
          <section className="import-review-section"><h3>Profile</h3><div className="form-stack">
            <Field label="Import: full name" name="import-name" value={importReview.resume.name} onChange={(value) => updateImportProfile('name', value)} placeholder="Not detected" />
            <Field label="Import: professional title" name="import-title" value={importReview.resume.title} onChange={(value) => updateImportProfile('title', value)} placeholder="Not detected" />
            <div className="form-row">
              <Field label="Import: location" name="import-location" value={importReview.resume.location} onChange={(value) => updateImportProfile('location', value)} placeholder="Not detected" />
              <Field label="Import: email" name="import-email" type="email" value={importReview.resume.email} onChange={(value) => updateImportProfile('email', value)} placeholder="Not detected" />
            </div>
            <Field label="Import: website" name="import-website" type="url" value={importReview.resume.website} onChange={(value) => updateImportProfile('website', value)} placeholder="Not detected" />
            <Field label="Import: LinkedIn profile" name="import-linkedin" type="url" value={importReview.resume.linkedin} onChange={(value) => updateImportProfile('linkedin', value)} placeholder="Not detected" />
            <TextArea label="Import: about" name="import-about" value={importReview.resume.about} onChange={(value) => updateImportProfile('about', value)} placeholder="No summary detected" rows={3} />
          </div></section>
          <section className="import-review-section"><h3>Experience <span>{importReview.resume.experience.length}</span></h3>
            {importReview.resume.experience.length ? importReview.resume.experience.map((entry, index) => <div className="form-stack import-review-entry" key={entry.id}>
              <Field label={`Experience ${index + 1}: position`} name={`import-experience-${entry.id}-role`} value={entry.role} onChange={(value) => updateImportExperience(index, 'role', value)} placeholder="Not detected" />
              <Field label={`Experience ${index + 1}: company`} name={`import-experience-${entry.id}-company`} value={entry.company} onChange={(value) => updateImportExperience(index, 'company', value)} placeholder="Not detected" />
              <div className="form-row">
                <Field label={`Experience ${index + 1}: dates`} name={`import-experience-${entry.id}-dates`} value={entry.dates} onChange={(value) => updateImportExperience(index, 'dates', value)} placeholder="Not detected" />
                <Field label={`Experience ${index + 1}: location`} name={`import-experience-${entry.id}-location`} value={entry.location} onChange={(value) => updateImportExperience(index, 'location', value)} placeholder="Not detected" />
              </div>
              <TextArea label={`Experience ${index + 1}: highlights`} name={`import-experience-${entry.id}-details`} value={entry.details} onChange={(value) => updateImportExperience(index, 'details', value)} placeholder="No highlights detected" rows={3} />
            </div>) : <p className="import-empty">No experience section detected.</p>}
          </section>
          <section className="import-review-section"><h3>Education <span>{importReview.resume.education.length}</span></h3>
            {importReview.resume.education.length ? importReview.resume.education.map((entry, index) => <div className="form-stack import-review-entry" key={entry.id}>
              <Field label={`Education ${index + 1}: school`} name={`import-education-${entry.id}-school`} value={entry.school} onChange={(value) => updateImportEducation(index, 'school', value)} placeholder="Not detected" />
              <Field label={`Education ${index + 1}: qualification`} name={`import-education-${entry.id}-degree`} value={entry.degree} onChange={(value) => updateImportEducation(index, 'degree', value)} placeholder="Not detected" />
              <Field label={`Education ${index + 1}: dates`} name={`import-education-${entry.id}-dates`} value={entry.dates} onChange={(value) => updateImportEducation(index, 'dates', value)} placeholder="Not detected" />
            </div>) : <p className="import-empty">No education section detected.</p>}
          </section>
          <section className="import-review-section"><h3>Skills <span>{importReview.resume.skills.length}</span></h3>
            <TextArea label="Import: skills" name="import-skills" value={importReview.resume.skills.join(', ')} onChange={updateImportSkills} placeholder="No skills detected" rows={3} />
          </section>
        </div>
        {importReview.extractedText !== null && <details className="extracted-text"><summary>Review extracted text</summary><pre>{importReview.extractedText}</pre></details>}
        <p className="review-privacy">Files are read in this browser only. We do not upload them or contact LinkedIn.</p>
        <div className="review-actions"><button className="button button-outline" type="button" onClick={() => setImportReview(null)}>Cancel</button><button className="button button-primary" type="button" onClick={confirmImport}>Replace current draft</button></div>
      </section></div>}
    </>
  )
}

export default App
