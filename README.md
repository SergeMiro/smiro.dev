# smiro.dev

**My portfolio — a static Astro build with no framework runtime on the page, a 3D laptop
that renders the site onto its own screen, a hand-written bilingual layer, and an AI avatar
that answers from a Markdown file I can edit without a deploy.**

[![Astro](https://img.shields.io/badge/Astro-6.1-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-edge_functions-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-static_%2B_edge-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Aura_TTS-13EF93)](https://deepgram.com/)
[![n8n](https://img.shields.io/badge/n8n-self--hosted-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)

🌐 **Live:** [smiro.dev](https://smiro.dev) — no login, the whole site is the demo.

---

## Table of contents

- [What this is](#what-this-is)
- [Features](#features)
- [Complete tech stack](#complete-tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Content model](#content-model)
- [Deployment](#deployment)
- [n8n automation](#n8n-automation)
- [Project structure](#project-structure)
- [License](#license)

## What this is

A portfolio site built the way I would build a product: the constraint was **no framework
runtime in the browser**. Astro compiles plain HTML pages to static files; nothing hydrates,
and the JavaScript that runs on the page is JavaScript I wrote by hand.

Three pages ship — the site itself and a CV in English and French — plus two serverless
functions that keep API keys off the client.

## Features

### The build

- **Astro 6** — static output, three HTML pages, zero client framework shipped
- **Tailwind CSS 4** through the Vite plugin, with **LightningCSS** minification
- `compressHTML`, viewport-based prefetch, generated sitemap
- **Vercel** — static hosting and edge/serverless functions in the same project

### The AI avatar

An avatar you can talk to, whose persona lives in a Markdown file rather than in the code.

- **`/api/agent-chat`** — a Vercel **Edge** function that streams the answer as it is
  generated (SSE, normalised to a single `{delta, done}` shape)
- **Multi-provider**, switchable per request: OpenRouter (GPT-OSS 120B, Nemotron Super 120B,
  GLM 4.5 Air, Qwen3 Coder, Llama 3.3 70B), Groq (Llama 3.3 70B), Google **Gemini 2.5 Flash**
- The system prompt is assembled server-side from **`public/kb/sergiy.md`** and cached for an
  hour — editing that file changes what the avatar says, with no deploy
- **Rate limited** (12 requests/hour) with caps on system prompt, message length and history
- **`/api/tts`** — a Deepgram Aura TTS proxy that keeps `DEEPGRAM_API_KEY` server-side and
  returns `audio/mpeg`; the client falls back to Web Speech if the proxy refuses

### Bilingual layer

No i18n library, by choice.

- `data-i18n` attributes — the markup declares what it is
- A key map for authored strings (`i18n.js`), plus a text map keyed by the English source
  (`i18n-fr.js`) for everything else
- A **MutationObserver** translates nodes inserted after first paint, so dynamic content is
  covered too
- `data-i18n-skip` marks subtrees that own their own translations (the readers do)

### 3D and motion

- **Three.js 0.183** renders a laptop model (`public/models/pc.glb`) with the page content
  drawn onto its screen (`pc3d.js`, ~1.6k lines). It is loaded as an ES module from jsDelivr
  through an import map, so it stays out of the build graph — the npm entry pins the version
  and supplies the types.
- The ideas deck is real **CSS 3D perspective**, not a carousel of images
- Motion elsewhere is hand-written CSS transitions and Web Animations

### Reading layer

Two readers over one pattern — the ideas deck opens essays, the projects deck opens project
pages.

- Content lives as data in `articles.js` and `works.js`, bilingual in the data itself, so a
  language switch repaints rather than reloads
- One overlay per reader: Escape, backdrop and outside-click close, with focus returned

### Agent sandbox

- Section `/06` lets a visitor run the agent profiles I actually work with, against a model,
  straight from the browser — one edge call per turn, so the key never reaches the client
- The **GitHub API** enriches the repository cards live from [@SergeMiro](https://github.com/SergeMiro)

### Theming

- `theme.js` owns the accent and background palettes in **OKLCH** and applies them to `:root`;
  it loads blocking in `<head>` so the first paint is already correct
- `settings.js` is the floating settings panel — UI only, so a swatch can never drift from
  what clicking it does

## Complete tech stack

| Area | Technologies |
| --- | --- |
| Framework & build | [Astro](https://astro.build/) 6.1 · `@astrojs/sitemap` · Vite · LightningCSS (the `mdx` and `react` integrations are wired up but not yet used) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4.2 (`@tailwindcss/vite`) · hand-written CSS · OKLCH colour system |
| 3D & animation | [Three.js](https://threejs.org/) 0.183 via a jsDelivr import map · CSS 3D transforms |
| Icons & images | `lucide-astro` · [Sharp](https://sharp.pixelplumbing.com/) |
| Runtime on the page | Vanilla JavaScript — no client framework hydration |
| Serverless | Vercel **Edge** function (`/api/agent-chat`) · Vercel serverless function (`/api/tts`) · TypeScript |
| AI providers | OpenRouter · Groq · Google Gemini 2.5 Flash |
| Speech | Deepgram Aura TTS · Web Speech API fallback |
| Integrations | GitHub REST API |
| i18n | Hand-rolled: `data-i18n` attributes + MutationObserver, EN/FR |
| Hosting | Vercel — static output with immutable asset caching |
| Automation | Self-hosted [n8n](https://n8n.io/) at `n8n.smiro.dev` |
| Tooling | Node.js ≥ 22.12 |

## Architecture

```
                          browser
                             │  (no framework runtime — only hand-written JS)
                             ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Astro 6 static build → dist/                                │
  │    src/pages/index.html    the site (~6.7k lines)            │
  │    src/pages/cv.html       CV, English                       │
  │    src/pages/cv-fr.html    CV, French                        │
  │                                                              │
  │  public/  loaded as plain scripts, cache-busted per file      │
  │    theme.js     OKLCH palettes, applied before first paint    │
  │    settings.js  the settings panel (UI only)                  │
  │    i18n.js      EN key map      i18n-fr.js  FR text map       │
  │    works.js     project data    articles.js essay data        │
  │    pc3d.js      Three.js laptop + screen render               │
  │    models/pc.glb, kb/sergiy.md, logos/                        │
  └───────────────┬──────────────────────────┬───────────────────┘
                  │                          │
                  ▼                          ▼
    /api/agent-chat  (Edge)         /api/tts  (Serverless)
    SSE streaming proxy             Deepgram Aura proxy
    rate limit 12/h                 keeps the key server-side
    system prompt ← kb/sergiy.md
                  │
                  ▼
    OpenRouter · Groq · Gemini      Deepgram
```

Decisions worth naming:

- **No hydration.** Astro is used purely as a static compiler. Anything interactive is
  written directly, which keeps the shipped payload equal to what the page needs.
- **Content as data, not markup.** `works.js` and `articles.js` carry both languages, so the
  readers are one implementation instead of two translated copies.
- **The persona is content.** `public/kb/sergiy.md` is the avatar's dossier; changing it
  changes the answers without a deploy.
- **Keys never reach the client.** Both AI and speech go through functions in `api/`.
- **Theme correctness before first paint.** `theme.js` is blocking in `<head>` on purpose.

## Getting started

```bash
git clone https://github.com/SergeMiro/smiro.dev.git
cd smiro.dev
npm install
npm run dev        # http://localhost:4321
```

| Command | Action |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Static production build to `./dist/` |
| `npm run preview` | Preview the build locally |
| `npm run astro …` | Astro CLI (`astro add`, `astro check`, …) |

Node.js **22.12+** is required (`engines` in `package.json`).

The two functions in `api/` are Vercel functions and are not served by `astro dev`; use
`vercel dev` to exercise the avatar and TTS locally.

## Environment variables

All are used only by the functions in `api/` — none is exposed to the browser. At least one
AI provider key is needed for the avatar; the site itself builds and runs without any of them.

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Free GLM, DeepSeek, Qwen and Llama models via openrouter.ai |
| `GROQ_API_KEY` | Ultra-fast Llama / Qwen via groq.com |
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash |
| `DEEPGRAM_API_KEY` | Deepgram Aura text-to-speech |

## Content model

| File | Holds |
| --- | --- |
| `public/works.js` | Every project: stack, sections, tech notes, repo and demo links — bilingual |
| `public/articles.js` | The essays behind the ideas deck — bilingual |
| `public/kb/sergiy.md` | The avatar's dossier, injected into the system prompt |
| `public/i18n.js` | English key map |
| `public/i18n-fr.js` | French translations, keyed by key and by English source text |
| `public/theme.js` | Accent and background palettes (OKLCH) |

Adding a project means adding an entry to `works.js` — no new markup, no new route.

## Deployment

Vercel, configured in [`vercel.json`](vercel.json):

- `framework: astro`, `npm run build` → `dist`
- `/_astro/*` and `/fonts/*` served `immutable` with a one-year max-age
- The mutable data scripts (`pc3d`, `settings`, `i18n`, `i18n-fr`, `articles`, `works`) are
  served `max-age=0, must-revalidate`, so a content change is visible immediately while the
  hashed build assets stay cached forever
- `api/*.ts` deploys automatically — no Astro adapter needed

## n8n automation

`n8n/` holds the **source** for the Code nodes of my self-hosted n8n workflows at
`n8n.smiro.dev` (n8n itself remains the source of truth for the live graph):

| Folder | Workflow | Schedule | Purpose |
| --- | --- | --- | --- |
| `job_autosearch/` | LinkedIn Job Search — Auto 7min | every 7 min | Multi-source listings (LinkedIn, HelloWork, APEC, France Travail) → Telegram |
| `job_prospect/` | *(in progress)* | hourly | Companies that are hiring → outbound prospect list → Telegram |

Each subfolder carries its own `nodes/`, `docs/` and `scripts/build_sdk.js`, which
regenerates the workflow SDK from `nodes/*.js` plus a live snapshot, then validates,
updates and publishes. **No secrets live in this repository** — credentials stay in n8n.

## Project structure

```
src/pages/
  index.html        the site — sections 01–06, readers, avatar, agent sandbox
  cv.html           CV, English
  cv-fr.html        CV, French
api/
  agent-chat.ts     Vercel Edge function — multi-provider SSE chat proxy
  tts.ts            Vercel serverless function — Deepgram Aura proxy
public/
  theme.js          OKLCH palettes, blocking in <head>
  settings.js       settings panel UI
  i18n.js           EN keys        i18n-fr.js   FR translations
  works.js          project data   articles.js  essay data
  pc3d.js           Three.js laptop with rendered screen
  models/           pc.glb + emissive texture
  kb/sergiy.md      avatar dossier
  logos/            project logos
  assets/           fonts and images
n8n/                Code-node sources for the self-hosted workflows
astro.config.mjs    integrations, prefetch, LightningCSS
vercel.json         caching strategy and framework config
```

## License

Proprietary — all rights reserved. This is my personal site; it is published so the code can
be read, not reused.

---

Built by **Sergiy Mirochnyk** · [smiro.dev](https://smiro.dev)
