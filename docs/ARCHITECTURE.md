# Architecture

OpenResume Live is a static React application built with TypeScript and Vite.

- `src/App.tsx` owns the editor, section navigation, portfolio preview, and print-ready resume view.
- `src/lib/resume.ts` defines the resume data model, sample profile, validation, and local-draft persistence.
- Drafts stay in browser local storage. No server API or inference service is used.
- Vite builds static assets for local development and the GitHub Pages project path.
- The Pages workflow runs unit tests, browser tests, lint, type-checking, and the production build before deployment.
