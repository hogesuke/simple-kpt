<p align="right">
  <a href="./README.md">JA</a> | EN
</p>

<div align="center">
  <img height="48" src="./public/logo.svg" alt="Simple KPT logo" align="middle">
  &nbsp;&nbsp;&nbsp;
  <a href="https://simple-kpt.com" target="_blank" rel="noopener">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./public/logotype-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="./public/logotype.svg">
      <img height="64" src="./public/logotype.svg" alt="Simple KPT" align="middle">
    </picture>
  </a>
</div>

<br>

<div align="center">
  <h2>
    Make team retrospectives refreshingly simple.<br>
    Minimal preparation, minimal effort. <br>
    Focus on your retrospectives with this KPT tool.
    <br>
    <br>
  </h2>
</div>

<br>

<div align="center">
  <a href="https://simple-kpt.com/demo" target="_blank" rel="noopener">
    <img src="https://img.shields.io/badge/⚡_Try_Demo-3f75ce?style=for-the-badge&logoColor=white" alt="Try Demo">
  </a>
</div>

<br>

<div align="center">

[![CI](https://github.com/hogesuke/simple-kpt/actions/workflows/ci.yml/badge.svg)](https://github.com/hogesuke/simple-kpt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hogesuke/simple-kpt/blob/main/LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)

</div>

<br>

<div align="center">
  <a href="https://simple-kpt.com/demo" target="_blank" rel="noopener">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./docs/screenshots/board-dark.webp">
      <img src="./docs/screenshots/board-light.webp" alt="Simple KPT">
    </picture>
  </a>
</div>

<br>

## Lighthouse Scores

![Performance](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-performance.json)
![Accessibility](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-accessibility.json)
![Best Practices](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-best-practices.json)
![SEO](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-seo.json)

## Features

- 🔄 KPT Framework
- ⏱️ Timer
- ✅ Try Progress Tracking
- 📥 Export
- 🤖 AI Summary
- 📈 Trend Charts
- 🌓 Dark Mode
- 🌐 Multilingual Support (Japanese / English)

## Tech Stack

- TypeScript
- React 19
- Tailwind CSS 4
- Zustand
- React Hook Form
- Zod
- shadcn/ui
- i18next
- Vite
- Vitest
- Playwright
- Storybook

## Infrastructure

- Supabase
- Vercel

## Requirements

- Node.js 24+

## Local Development

### Installation

```bash
pnpm install --frozen-lockfile

brew install supabase/tap/supabase
```

### Environment Variables

Create `.env.local` and set the values displayed by `supabase start`.

```bash
VITE_SUPABASE_URL=<Supabase URL> # e.g., http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<Supabase Anon Key> # e.g., sb_publishable_xxxxxxxx...
```

### Start

```bash
supabase start

pnpm dev
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm e2e

# E2E tests (UI mode)
pnpm e2e:ui
```

## Storybook

### Local

```bash
pnpm storybook
```

### Public URL

https://hogesuke.github.io/simple-kpt/

## Directory Structure

```
.
├── src/
│   ├── components/   # UI Components
│   ├── contexts/     # React Context
│   ├── hooks/        # Custom Hooks
│   ├── lib/          # Utilities & API
│   ├── pages/        # Page Components
│   ├── stores/       # Zustand Stores
│   └── types/        # Type Definitions
│
└── supabase/
    ├── functions/    # Edge Functions
    ├── migrations/   # Migrations
    └── seed.sql      # Seed Data
```

## License

MIT License
