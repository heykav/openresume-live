# OpenResume Live

OpenResume Live is a browser-based resume and portfolio editor. Edit your profile, experience, education, and skills beside a portfolio preview that updates as you write. Switch to a clean resume layout to print or save as PDF.

The starter profile is illustrative sample content. Replace it with your own details before sharing or printing. This MVP does not use AI inference.

## Run locally

```sh
npm install
npm run dev
```

## Work with your draft

- Choose a section in the left rail and edit its fields. Add or remove experience and education entries as needed.
- Switch between the portfolio site and resume layout in the live preview.
- Changes are saved in this browser on this device. No account or server is required.
- **Export draft** downloads a JSON backup. **Save as PDF** opens the browser print dialog with the resume layout selected.
- **Restore sample content** replaces the current draft after confirmation.

Clearing this browser's site data will remove the saved draft, so export a JSON backup to keep a copy.

## Checks

```sh
npm test
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

## Deploy to GitHub Pages

The workflow at `.github/workflows/pages.yml` tests, lints, builds, and deploys the site when changes reach `main`. In **Settings → Pages**, choose **GitHub Actions** as the source.

Vite uses `/openresume-live/` as the base path in GitHub Actions builds and `/` for local development.

## Privacy

Resume data stays in browser local storage and is not sent to an OpenResume server. See [PRIVACY.md](./PRIVACY.md) for details.
