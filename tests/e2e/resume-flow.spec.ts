import { expect, test } from '@playwright/test'
import JSZip from 'jszip'

async function createDocxResume(): Promise<Buffer> {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)
  zip.file('_rels/.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)
  zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${[
    'Avery Brooks',
    'Product engineer',
    'avery@example.com',
    'SUMMARY',
    'I build accessible tools and make complex workflows easier for teams.',
    'EXPERIENCE',
    'Senior Engineer',
    'Northstar Labs',
    '2021 - 2025',
    'Improved task completion by 32%.',
    'EDUCATION',
    'Northstar University',
    'BS, Computer Science',
    'SKILLS',
    'TypeScript, Accessibility, Testing, React',
  ].map((text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`)
  return zip.generateAsync({ type: 'nodebuffer' })
}

function createPdfResume(): Buffer {
  const content = `BT /F1 12 Tf 50 740 Td (Avery Brooks) Tj 0 -18 Td (Product engineer) Tj 0 -18 Td (avery@example.com) Tj 0 -30 Td (SUMMARY) Tj 0 -18 Td (I build reliable tools and make complex workflows easier for teams.) Tj 0 -30 Td (EXPERIENCE) Tj 0 -18 Td (Senior Engineer) Tj 0 -18 Td (Northstar Labs) Tj 0 -18 Td (2021 - 2025) Tj 0 -18 Td (Improved task completion by 32%.) Tj 0 -30 Td (EDUCATION) Tj 0 -18 Td (Northstar University) Tj 0 -18 Td (BS, Computer Science) Tj 0 -30 Td (SKILLS) Tj 0 -18 Td (TypeScript, Accessibility, Testing, React) Tj ET`
  const stream = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    stream,
  ]
  let document = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document))
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(document)
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(document)
}

test.describe('OpenResume Live editor', () => {
  test('edits a profile and reflects changes in the portfolio preview', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
    await page.getByLabel('Full name').fill('Avery Brooks')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Avery Brooks.' })).toBeVisible()
  })

  test('reflects every profile field in portfolio and resume previews', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Full name').fill('Jordan Rivera')
    await page.getByLabel('Professional title').fill('Accessibility engineer')
    await page.getByLabel('Location').fill('Toronto, Canada')
    await page.getByLabel('Email').fill('jordan@example.com')
    await page.getByLabel('Website').fill('jordan.example')
    await page.getByLabel('About').fill('I make digital products clearer and more inclusive.')

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }

    await expect(page.getByRole('heading', { name: 'Jordan Rivera.' })).toBeVisible()
    await expect(page.locator('.site-overline')).toHaveText('Toronto, Canada')
    await expect(page.locator('.site-hero-content > p')).toHaveText('Accessibility engineer')
    await expect(page.locator('.site-intro > p')).toHaveText('I make digital products clearer and more inclusive.')
    await expect(page.getByRole('button', { name: 'Contact' })).toBeVisible()

    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.locator('.resume-header h2')).toHaveText('Jordan Rivera')
    await expect(page.locator('.resume-contact')).toContainText('jordan@example.com')
    await expect(page.locator('.resume-contact')).toContainText('Toronto, Canada')
    await expect(page.locator('.resume-contact')).toContainText('jordan.example')
    await expect(page.locator('.resume-section').filter({ has: page.getByRole('heading', { name: 'Profile' }) })).toContainText('I make digital products clearer and more inclusive.')
  })

  test('scores resume completeness and navigates to the relevant section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.resume-score summary > b')).toContainText('85')
    await page.locator('.resume-score summary').click()
    await page.getByRole('button', { name: /Measurable outcomes/ }).click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'Experience', exact: true })).toBeVisible()
    await expect(page.getByText(/not an ATS, hiring, or job-fit prediction/i)).toBeVisible()
  })

  test('adds a LinkedIn profile link to the preview without scraping it', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('LinkedIn profile').fill('https://www.linkedin.com/in/avery-brooks')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    const profileLink = page.getByRole('link', { name: 'LinkedIn profile' })
    await expect(profileLink).toHaveAttribute('href', 'https://www.linkedin.com/in/avery-brooks')
    await expect(profileLink).toHaveAttribute('target', '_blank')
  })

  test('switches sections, adds a role, and opens the resume layout', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Experience,/ }).click()
    await page.getByRole('button', { name: 'Add role' }).click()
    await page.getByLabel('Position').last().fill('Design director')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Design director' })).toBeVisible()
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible()
  })

  test('animates preview format changes and respects reduced-motion preferences', async ({ page }) => {
    await page.goto('/')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect.poll(() => page.locator('.preview-scroll').evaluate((element) => getComputedStyle(element.firstElementChild!).animationName))
      .toBe('proof-arrive')
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect.poll(() => page.locator('.preview-scroll').evaluate((element) => getComputedStyle(element.firstElementChild!).animationName))
      .toBe('proof-arrive')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Portfolio', exact: true }).click()
    await expect.poll(() => page.locator('.preview-scroll').evaluate((element) => getComputedStyle(element.firstElementChild!).animationName))
      .toBe('none')
  })

  test('jumps from the live preview back to the matching editor section', async ({ page }) => {
    await page.goto('/')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }

    await page.getByRole('button', { name: 'Work', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible()

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await page.getByRole('button', { name: 'Edit education' }).click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'Education', exact: true })).toBeVisible()
  })

  test('reorders experience and reflects the new order in the live portfolio', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Experience,/ }).click()
    await page.getByRole('button', { name: 'Move Senior Product Designer down' }).click()

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }

    await expect(page.locator('.site-work-item h3')).toHaveText([
      'Product Designer',
      'Senior Product Designer',
    ])
  })

  test('adds, reorders, and removes education entries', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Education,/ }).click()
    await page.getByRole('button', { name: 'Add school' }).click()
    await page.getByLabel('School').last().fill('Northstar Institute')
    await page.getByLabel('Degree or program').last().fill('Certificate, Product Design')
    await page.getByLabel('Dates').last().fill('2024 — 2025')
    await page.getByRole('button', { name: 'Move Parsons School of Design down' }).click()

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.locator('.resume-section').filter({ has: page.getByRole('heading', { name: 'Education' }) }).locator('.resume-entry h4')).toHaveText([
      'Northstar Institute',
      'Parsons School of Design',
    ])
    await expect(page.locator('.resume-entry').filter({ hasText: 'Northstar Institute' })).toContainText('Certificate, Product Design')
    await expect(page.locator('.resume-entry').filter({ hasText: 'Northstar Institute' })).toContainText('2024 — 2025')

    await page.getByRole('button', { name: 'Edit education' }).click()
    await page.getByRole('button', { name: 'Remove Northstar Institute' }).click()
    await expect(page.getByRole('button', { name: 'Remove Parsons School of Design' })).toBeVisible()
    await page.getByRole('button', { name: 'Remove Parsons School of Design' }).click()
    await expect(page.getByText('Every path starts somewhere.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Education, empty' })).toBeVisible()
  })

  test('removes experience entries and can restart from its empty state', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Experience,/ }).click()
    await page.getByRole('button', { name: 'Remove Senior Product Designer' }).click()
    await page.getByRole('button', { name: 'Remove Product Designer' }).click()
    await expect(page.getByText('Make room for good work.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Experience, empty' })).toBeVisible()

    await page.getByRole('button', { name: 'Add your first role' }).click()
    await page.getByLabel('Position').fill('Independent designer')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.locator('.site-work-item h3')).toHaveText(['Independent designer'])
  })

  test('edits experience details and reflects company, location, dates, and highlights in both previews', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Experience,/ }).click()
    await page.getByLabel('Position').first().fill('Staff product designer')
    await page.getByLabel('Company').first().fill('Juniper Labs')
    await page.getByLabel('Dates').first().fill('2023 — current')
    await page.getByLabel('Location').first().fill('Remote')
    await page.getByLabel('Highlights').first().fill('Shipped a public launch.\nReduced onboarding time.')

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.locator('.site-work-item h3').first()).toHaveText('Staff product designer')
    await expect(page.locator('.site-work-item').first()).toContainText('Juniper Labs')
    await expect(page.locator('.site-work-item').first()).toContainText('Remote')
    await expect(page.locator('.site-work-item').first()).toContainText('2023 — current')
    await expect(page.locator('.site-work-item').first()).toContainText('Shipped a public launch.')

    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.locator('.resume-entry').first()).toContainText('Staff product designer')
    await expect(page.locator('.resume-entry').first()).toContainText('Juniper Labs')
    await expect(page.locator('.resume-entry').first()).toContainText('Reduced onboarding time.')
  })

  test('edits skills, reflects them in both previews, and restores them after reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Skills,/ }).click()
    await page.getByLabel('Your skills').fill('Systems thinking, Editorial design')
    await expect(page.locator('.skill-chip')).toHaveText(['Systems thinking', 'Editorial design'])

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.locator('.site-skill-list')).toContainText('Systems thinking')

    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.locator('.resume-section').filter({ has: page.getByRole('heading', { name: 'Skills' }) })).toContainText('Editorial design')
    await expect(page.getByRole('status')).toHaveText('Saved on this device')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Skills,/ }).click()
    await expect(page.getByLabel('Your skills')).toHaveValue('Systems thinking, Editorial design')
  })

  test('exports a JSON draft and prepares the resume before printing', async ({ page }) => {
    await page.addInitScript(() => {
      const createObjectURL = URL.createObjectURL.bind(URL)
      URL.createObjectURL = (blob) => {
        if (blob instanceof Blob) {
          void blob.text().then((content) => { document.documentElement.dataset.exportedDraft = content })
        }
        return createObjectURL(blob)
      }
    })
    await page.goto('/')
    await page.getByLabel('Full name').fill('Jordan Rivera')
    await expect(page.getByRole('status')).toHaveText('Saved on this device')
    const printCalled = page.evaluate(() => {
      window.print = () => { document.documentElement.dataset.printCalled = 'true' }
    })
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export draft' }).click()
    const download = await downloadPromise
    await printCalled
    expect(download.suggestedFilename()).toBe('openresume-draft.json')
    await expect.poll(() => page.locator('html').getAttribute('data-exported-draft')).not.toBeNull()
    expect(JSON.parse((await page.locator('html').getAttribute('data-exported-draft')) ?? '{}').name).toBe('Jordan Rivera')

    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await page.getByRole('button', { name: (page.viewportSize()?.width ?? 0) <= 760 ? 'PDF' : 'Save as PDF' }).click()
    await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => page.locator('html').getAttribute('data-print-called')).toBe('true')
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.topbar')).toBeHidden()
    await expect(page.locator('.preview-edit-link').first()).toBeHidden()
    await expect(page.locator('.portfolio-page')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  })

  test('validates and imports a JSON draft without losing the current draft on failure', async ({ page }) => {
    await page.goto('/')
    const fileInput = page.locator('input[type="file"]')
    const uploadDraft = (name: string, contents: string) => fileInput.evaluate((element, file) => {
      const transfer = new DataTransfer()
      transfer.items.add(new File([file.contents], file.name, { type: 'application/json' }))
      const input = element as HTMLInputElement
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, { name, contents })
    await uploadDraft('broken.json', '{broken')
    await expect(page.getByRole('alert')).toHaveText('The selected file is not valid JSON. Choose an OpenResume JSON backup.')
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Maya Chen')

    const imported = {
      name: 'Jordan Rivera',
      title: 'Accessibility engineer',
      location: 'Toronto, Canada',
      email: 'jordan@example.com',
      website: 'jordan.example',
      about: 'A carefully imported draft.',
      experience: [],
      education: [],
      skills: ['Inclusive design'],
    }
    await uploadDraft('openresume-draft.json', JSON.stringify(imported))
    await expect(page.getByRole('dialog', { name: 'Review before replacing' }).getByLabel('Import: full name')).toHaveValue('Jordan Rivera')
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Maya Chen')
    await page.getByRole('button', { name: 'Replace current draft' }).click()
    await expect(page.getByLabel('Full name')).toHaveValue('Jordan Rivera')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Jordan Rivera.' })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Saved on this device')
    await page.reload()
    await expect(page.getByLabel('Full name')).toHaveValue('Jordan Rivera')
  })

  test('extracts DOCX locally and lets the user review before replacing the draft', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'avery-resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: await createDocxResume(),
    })

    const review = page.getByRole('dialog', { name: 'Review before replacing' })
    await expect(review.getByLabel('Import: full name')).toHaveValue('Avery Brooks')
    await expect(review.getByLabel('Import: email')).toHaveValue('avery@example.com')
    await expect(review.locator('.extracted-text')).toContainText('Improved task completion by 32%.')
    await review.getByLabel('Import: professional title').fill('Product systems engineer')
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Maya Chen')
    await page.getByRole('button', { name: 'Replace current draft' }).click()
    await expect(page.getByLabel('Full name')).toHaveValue('Avery Brooks')
    await expect(page.getByLabel('Professional title')).toHaveValue('Product systems engineer')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Experience,/ }).click()
    await expect(page.getByLabel('Position')).toHaveValue('Senior Engineer')
    await page.getByRole('navigation', { name: 'Edit resume section' }).getByRole('button', { name: /^Education,/ }).click()
    await expect(page.getByLabel('School')).toHaveValue('Northstar University')
  })

  test('extracts selectable PDF text in-browser and previews the mapped fields', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'avery-resume.pdf',
      mimeType: 'application/pdf',
      buffer: createPdfResume(),
    })

    const review = page.getByRole('dialog', { name: 'Review before replacing' })
    await expect(review.getByLabel('Import: full name')).toHaveValue('Avery Brooks')
    await expect(review.getByLabel('Import: email')).toHaveValue('avery@example.com')
    await expect(review.locator('.extracted-text')).toContainText('Improved task completion by 32%.')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Maya Chen')
  })

  test('wraps unusually long profile content without widening the preview', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Full name').fill('山'.repeat(100))
    await page.getByLabel('About').fill('👩🏽‍💻 '.repeat(60))
    await page.getByLabel('Professional title').fill('Product design and accessibility '.repeat(8))
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.locator('.site-hero h2')).toContainText('山')
    await expect.poll(() => page.locator('.preview-scroll').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect.poll(() => page.locator('.preview-scroll').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  })

  test('keeps profile fields usable at a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 })
    await page.goto('/')
    await page.getByLabel('Email').fill('career-contact@example.com')

    await expect(page.getByLabel('Email')).toHaveValue('career-contact@example.com')
    await expect.poll(() => page.getByLabel('Email').evaluate((element) => element.clientWidth)).toBeGreaterThan(250)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  })

  test('confirms restoring sample content after editing the profile', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Full name').fill('Avery Brooks')
    page.once('dialog', (dialog) => dialog.dismiss())
    await page.getByRole('button', { name: 'Restore sample content' }).click()
    await expect(page.getByLabel('Full name')).toHaveValue('Avery Brooks')

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Restore sample content' }).click()
    await expect(page.getByLabel('Full name')).toHaveValue('Maya Chen')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Maya Chen.' })).toBeVisible()
  })

  test('shows an explicit save error when browser storage rejects a draft', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key === 'openresume-live:draft:v1') throw new DOMException('Storage is full', 'QuotaExceededError')
        originalSetItem.call(this, key, value)
      }
    })
    await page.goto('/')
    await page.getByLabel('Full name').fill('Avery Brooks')
    await expect(page.getByRole('status')).toHaveText('Couldn’t save draft', { timeout: 5000 })
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Avery Brooks.' })).toBeVisible()
  })

  test('recovers gracefully from malformed saved draft data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('openresume-live:draft:v1', '{not valid json')
    })
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Saved draft unreadable — sample loaded')
    await expect(page.getByLabel('Full name')).toHaveValue('Maya Chen')
    await expect(page.locator('.sample-tag')).toHaveText('SAMPLE')
  })

  test('keeps editing available when browser storage is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => { throw new DOMException('Storage access is blocked', 'SecurityError') },
      })
    })
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local storage unavailable')
    await page.getByLabel('Full name').fill('Jordan Rivera')
    await expect(page.getByLabel('Full name')).toHaveValue('Jordan Rivera')
    await expect(page.getByRole('status')).toHaveText('Local storage unavailable')
  })
})
