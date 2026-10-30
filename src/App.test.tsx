import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

    expect(screen.getByRole('heading', { name: 'Your profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Maya Chen')
    expect(screen.getByRole('heading', { name: 'Maya Chen.' })).toBeInTheDocument()
    expect(screen.getByText('SAMPLE')).toBeInTheDocument()
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

  it('adds an experience entry and switches to the resume preview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Experience' }))
    await user.click(screen.getByRole('button', { name: 'Add role' }))
    const positionFields = screen.getAllByLabelText('Position')
    await user.type(positionFields[positionFields.length - 1], 'Design director')

    expect(screen.getByRole('heading', { name: 'Design director' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Resume$/ }))
    expect(screen.getByRole('heading', { name: 'Maya Chen' })).toBeInTheDocument()
  })
})
