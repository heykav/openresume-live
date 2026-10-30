import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/resume'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('OpenResume Live editor', () => {
  it('starts with clearly marked sample content and a live portfolio preview', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Skip to editor' })).toHaveAttribute('href', '#resume-editor')
    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Maya Chen')
    expect(screen.getByLabelText('Full name')).toHaveAttribute('name', 'name')
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Email')).toHaveAttribute('spellcheck', 'false')
    expect(screen.getByRole('heading', { name: 'Maya Chen.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Krishna Anubhav' })).toHaveAttribute('href', 'https://krishnaanubhav.com')
    expect(screen.getByText('SAMPLE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Portfolio' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates the live preview and persists profile edits locally', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nameField = screen.getByLabelText('Full name')
    await user.clear(nameField)
    await user.type(nameField, 'Avery Brooks')

    expect(screen.getByRole('heading', { name: 'Avery Brooks.' })).toBeInTheDocument()
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').name).toBe('Avery Brooks')
    })
  })

  it('shows a live checklist score and opens the section for an improvement', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('85')).toBeInTheDocument()
    await user.click(screen.getByText('Resume score'))
    await user.click(screen.getByRole('button', { name: /Measurable outcomes/ }))

    expect(screen.getByRole('heading', { name: 'Experience', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/not an ATS, hiring, or job-fit prediction/i)).toBeInTheDocument()
  })

  it('saves and safely renders a LinkedIn profile link', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('LinkedIn profile'), 'https://www.linkedin.com/in/avery-brooks')
    await user.click(screen.getByRole('button', { name: /^Resume$/ }))
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/avery-brooks')
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').linkedin).toBe('https://www.linkedin.com/in/avery-brooks')
    })
  })

  it('lets the user review or cancel a JSON import before replacing the draft', async () => {
    const user = userEvent.setup()
    render(<App />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imported = {
      name: 'Jordan Rivera',
      title: 'Accessibility engineer',
      location: 'Toronto, Canada',
      email: 'jordan@example.com',
      website: '',
      about: 'A carefully imported draft.',
      experience: [],
      education: [],
      skills: ['Inclusive design'],
    }

    fireEvent.change(fileInput, { target: { files: [new File([JSON.stringify(imported)], 'resume.json', { type: 'application/json' })] } })
    expect(await screen.findByRole('dialog', { name: 'Review before replacing' })).toBeInTheDocument()
    const importName = screen.getByLabelText('Import: full name')
    expect(importName).toHaveValue('Jordan Rivera')
    fireEvent.change(importName, { target: { value: 'Jordan Rivera edited' } })
    expect(screen.getByLabelText('Full name')).toHaveValue('Maya Chen')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Maya Chen')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Import resume' })).toHaveFocus())
  })

  it('flushes the latest edit to local storage when the page is hidden', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Not yet debounced' } })

    window.dispatchEvent(new Event('pagehide'))

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').name).toBe('Not yet debounced')
  })

  it('does not rewrite recovered data on pagehide when no edit is pending', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken')
    render(<App />)

    window.dispatchEvent(new Event('pagehide'))

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{broken')
  })

  it('adds an experience entry and switches to the resume preview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Experience,/ }))
    await user.click(screen.getByRole('button', { name: 'Add role' }))
    const positionFields = screen.getAllByLabelText('Position')
    await user.type(positionFields[positionFields.length - 1], 'Design director')

    expect(screen.getByRole('heading', { name: 'Design director' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Resume$/ }))
    expect(screen.getByRole('heading', { name: 'Maya Chen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resume' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('tracks which sections have content as profile details are cleared', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('progressbar', { name: 'Resume sections with content' })).toHaveAttribute('aria-valuenow', '4')

    for (const label of ['Full name', 'Professional title', 'Location', 'Email', 'Website', 'About']) {
      await user.clear(screen.getByLabelText(label))
    }

    expect(screen.getByRole('progressbar', { name: 'Resume sections with content' })).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByText('1 section needs a starting point.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile, empty' })).toBeInTheDocument()
  })

  it('jumps from the resume preview to its matching editor section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Resume$/ }))
    await user.click(screen.getByRole('button', { name: 'Edit education' }))

    expect(screen.getByRole('heading', { name: /^Education$/, level: 1 })).toBeInTheDocument()
  })

  it('reorders experience entries and updates the portfolio preview order', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Experience,/ }))
    expect(screen.getByRole('button', { name: 'Move Senior Product Designer up' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move Senior Product Designer down' }))

    const preview = within(screen.getByRole('region', { name: 'Live preview' }))
    expect(preview.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Product Designer',
      'Senior Product Designer',
    ])
  })
})
