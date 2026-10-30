import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import './App.css'
import { DEFAULT_RESUME, readResume, saveResume, type EducationEntry, type ExperienceEntry, type Resume } from './lib/resume'

type IconName = 'profile' | 'work' | 'school' | 'skills' | 'plus' | 'download' | 'print' | 'arrow' | 'close'
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
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
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
        <Field label="Full name" value={resume.name} onChange={(value) => update('name', value)} placeholder="Your name" />
        <Field label="Professional title" value={resume.title} onChange={(value) => update('title', value)} placeholder="e.g. Product designer" />
        <div className="form-row">
          <Field label="Location" value={resume.location} onChange={(value) => update('location', value)} placeholder="City, country" />
          <Field label="Email" value={resume.email} onChange={(value) => update('email', value)} placeholder="you@example.com" type="email" />
        </div>
        <Field label="Website" value={resume.website} onChange={(value) => update('website', value)} placeholder="yourwebsite.com" type="url" />
        <TextArea label="About" value={resume.about} onChange={(value) => update('about', value)} placeholder="A short introduction, in your own words." rows={5} />
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

  return (
    <>
      <SectionHeading title={label} description={isExperience ? 'Show the work, not just the job title.' : 'Add the learning that shaped your work.'}>
        <button className="button button-outline button-small" type="button" onClick={addEntry}><Icon name="plus" size={16} />Add {singular}</button>
      </SectionHeading>
      {entries.length ? (
        <div className="entry-list">
          {entries.map((entry, index) => (
            <section className="entry-editor" key={entry.id}>
              <div className="entry-editor-heading">
                <span className="entry-index">{String(index + 1).padStart(2, '0')}</span>
                <span>{('role' in entry ? entry.role : entry.school) || `New ${singular}`}</span>
                <button className="icon-button remove-button" type="button" aria-label={`Remove ${('role' in entry ? entry.role : entry.school) || singular}`} onClick={() => removeEntry(entry.id)}><Icon name="close" size={17} /></button>
              </div>
              <div className="form-stack">
                {fields.map(([key, fieldLabel, placeholder]) => {
                  const value = (entry as unknown as Record<string, string>)[key] ?? ''
                  return <Field key={key} label={fieldLabel} value={value} onChange={(next) => updateEntry(index, key, next)} placeholder={placeholder} />
                })}
                {isExperience && 'details' in entry && <TextArea label="Highlights" value={entry.details} onChange={(value) => updateEntry(index, 'details', value)} placeholder="One highlight per line" rows={4} />}
              </div>
            </section>
          ))}
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
        <TextArea label="Your skills" value={draft} onChange={update} placeholder="Research, prototyping, facilitation" rows={5} />
        <p className="field-hint">Separate each skill with a comma. They’ll appear as a tidy list in your preview.</p>
        <div className="skill-preview"><span className="field-label">IN YOUR PREVIEW</span><div className="skill-list">{skills.length ? skills.map((skill, index) => <span className="skill-chip" key={`${skill}-${index}`}>{skill}</span>) : <span className="muted-copy">Your skills will appear here.</span>}</div></div>
      </div>
    </>
  )
}

function ResumePreview({ resume }: { resume: Resume }) {
  const experience = resume.experience.filter((entry) => entry.role || entry.company || entry.details)
  const education = resume.education.filter((entry) => entry.school || entry.degree)
  return (
    <article className="portfolio-page resume-page">
      <header className="resume-header">
        <div><h2>{resume.name || 'Your name'}</h2><p>{resume.title || 'Your professional title'}</p></div>
        <div className="resume-contact">{[resume.email, resume.location, resume.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div>
      </header>
      {resume.about && <section className="resume-section"><h3>Profile</h3><p>{resume.about}</p></section>}
      {experience.length > 0 && <section className="resume-section"><h3>Experience</h3>{experience.map((entry) => <div className="resume-entry" key={entry.id}><div className="resume-entry-top"><h4>{entry.role || entry.company}</h4><span>{entry.dates}</span></div><p className="resume-entry-sub">{[entry.company, entry.location].filter(Boolean).join(' · ')}</p>{entry.details && <ul>{entry.details.split('\n').filter(Boolean).map((line, index) => <li key={`${entry.id}-${index}`}>{line}</li>)}</ul>}</div>)}</section>}
      {education.length > 0 && <section className="resume-section"><h3>Education</h3>{education.map((entry) => <div className="resume-entry resume-education" key={entry.id}><div className="resume-entry-top"><h4>{entry.school}</h4><span>{entry.dates}</span></div><p className="resume-entry-sub">{entry.degree}</p></div>)}</section>}
      {resume.skills.length > 0 && <section className="resume-section"><h3>Skills</h3><p>{resume.skills.join(' · ')}</p></section>}
    </article>
  )
}

function PortfolioPreview({ resume }: { resume: Resume }) {
  const experience = resume.experience.filter((entry) => entry.role || entry.company || entry.details)
  const initials = resume.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'YO'
  return (
    <article className="portfolio-page site-page">
      <header className="site-header"><span className="site-mark">{initials}</span><nav aria-label="Portfolio navigation"><span>Work</span><span>About</span>{resume.email && <span>Contact</span>}</nav></header>
      <section className="site-hero">
        <div className="site-hero-content"><span className="site-overline">{resume.location || 'Independent creative'}</span><h2>{resume.name || 'Your name'}<span>.</span></h2><p>{resume.title || 'Your professional title'}</p></div>
        <span className="hero-coordinate">PORTFOLIO / {new Date().getFullYear()}</span>
      </section>
      <section className="site-intro"><span className="site-label">A LITTLE ABOUT ME</span><p>{resume.about || 'Add a few sentences about what you do and what you care about.'}</p></section>
      {experience.length > 0 && <section className="site-work"><div className="site-section-heading"><span className="site-label">SELECTED EXPERIENCE</span><span className="site-count">{String(experience.length).padStart(2, '0')} ENTRIES</span></div>{experience.map((entry, index) => <article className="site-work-item" key={entry.id}><span className="work-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{entry.role || entry.company}</h3><p>{entry.company}{entry.location ? ` · ${entry.location}` : ''}</p>{entry.details && <p className="work-detail">{entry.details.split('\n').filter(Boolean)[0]}</p>}</div><span className="work-dates">{entry.dates}</span></article>)}</section>}
      {resume.skills.length > 0 && <section className="site-skills"><span className="site-label">GOOD AT</span><div className="site-skill-list">{resume.skills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>)}</div></section>}
      <footer className="site-footer">{resume.email ? <span>{resume.email}</span> : <span>Add your email to make it easy to get in touch.</span>}<span>Made with OpenResume</span></footer>
    </article>
  )
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function App() {
  const [loadedDraft] = useState(() => readResume())
  const [resume, setResume] = useState(loadedDraft.resume)
  const [saveState, setSaveState] = useState(loadedDraft.status)
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [activeView, setActiveView] = useState<PreviewMode>('portfolio')
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const previousResume = useRef(resume)

  useEffect(() => {
    if (previousResume.current === resume) return
    previousResume.current = resume
    if (saveState === 'unavailable') return
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      try {
        saveResume(resume)
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [resume])

  const updateProfile = (key: keyof Omit<Resume, 'experience' | 'education' | 'skills'>, value: string) => {
    setResume((current) => ({ ...current, [key]: value }))
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
    URL.revokeObjectURL(url)
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
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="OpenResume home"><span className="brand-symbol">o</span><span>openresume<span className="brand-period">.</span></span><span className="brand-live">LIVE</span></a>
        <div className="topbar-right">
          <span className={`save-indicator ${saveState}`} role="status" aria-live="polite"><span className="save-dot" />{saveLabel}</span>
          <span className="topbar-divider" />
          <button className="button button-quiet top-action" type="button" onClick={downloadDraft}><Icon name="download" size={17} /><span>Export draft</span></button>
          <button className="button button-primary top-action" type="button" onClick={printResume}><Icon name="print" size={17} /><span>Save as PDF</span></button>
          <button className="mobile-pane-toggle" type="button" onClick={() => setMobilePane((current) => current === 'edit' ? 'preview' : 'edit')}>{mobilePane === 'edit' ? 'See preview' : 'Back to editing'}<Icon name="arrow" size={16} /></button>
        </div>
      </header>
      <div className="workspace">
        <aside className={`section-rail ${mobilePane === 'preview' ? 'mobile-hidden' : ''}`} aria-label="Resume sections">
          <div className="rail-heading"><span>YOUR RESUME</span><span className="sample-tag">{saveState === 'sample' ? 'SAMPLE' : 'DRAFT'}</span></div>
          <nav className="section-nav" aria-label="Edit resume section">{sections.map((section, index) => <button className={`section-nav-item ${activeSection === section.id ? 'active' : ''}`} type="button" key={section.id} onClick={() => setActiveSection(section.id)} aria-label={section.label} aria-current={activeSection === section.id ? 'page' : undefined}><span className="nav-icon"><Icon name={section.icon} size={17} /></span><span className="nav-label">{section.label}</span><span className="nav-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></button>)}</nav>
          <div className="rail-bottom"><div className="privacy-note"><span className="privacy-lock" aria-hidden="true">⌑</span><div><strong>Your draft stays yours.</strong><span>Saved privately on this device.</span></div></div><button className="restore-button" type="button" onClick={restoreSample}>Restore sample content</button></div>
        </aside>
        <main className={`editor-panel ${mobilePane === 'preview' ? 'mobile-hidden' : ''}`}>
          <div className="editor-topline"><span>EDITING / <strong>{sections.find((section) => section.id === activeSection)?.label.toUpperCase()}</strong></span><span className="edit-live"><span /> LIVE</span></div>
          <div className="editor-scroll">
            {activeSection === 'profile' && <ProfileEditor resume={resume} update={updateProfile} />}
            {activeSection === 'experience' && <EntriesEditor kind="experience" entries={resume.experience} setResume={setResume} />}
            {activeSection === 'education' && <EntriesEditor kind="education" entries={resume.education} setResume={setResume} />}
            {activeSection === 'skills' && <SkillsEditor skills={resume.skills} setResume={setResume} />}
            <div className="editor-bottom-note"><span className="note-line" /><p>Every change finds its way to the page.</p></div>
          </div>
        </main>
        <section className={`preview-panel ${mobilePane === 'edit' ? 'mobile-hidden' : ''}`} aria-label="Live preview">
          <div className="preview-toolbar"><div className="preview-heading"><span className="preview-live-mark"><span /></span><span>LIVE PREVIEW</span><span className="preview-separator">/</span><span className="preview-device">WEB</span></div><div className="preview-toolbar-actions"><div className="preview-controls" role="group" aria-label="Preview format"><button className={activeView === 'portfolio' ? 'selected' : ''} type="button" onClick={() => setActiveView('portfolio')}>Portfolio</button><button className={activeView === 'resume' ? 'selected' : ''} type="button" onClick={() => setActiveView('resume')}>Resume</button></div><button className="mobile-print" type="button" onClick={printResume}><Icon name="print" size={15} /><span>PDF</span></button></div></div>
          <div className="preview-canvas"><div className="preview-page-label"><span>{activeView === 'portfolio' ? 'PERSONAL SITE' : 'RESUME FORMAT'}</span><span className="page-status"><span /> UP TO DATE</span></div><div className="preview-scroll">{activeView === 'portfolio' ? <PortfolioPreview resume={resume} /> : <ResumePreview resume={resume} />}</div></div>
          <div className="preview-footnote"><span aria-hidden="true">↳</span> {saveState === 'sample' ? 'This is a sample profile. Make it yours as you edit.' : 'Your content stays on this device.'}</div>
        </section>
      </div>
    </div>
  )
}

export default App
