# Jason Au-Yeung Portfolio

This repository contains a static personal portfolio website for Jason Au-Yeung. The site presents professional experience, featured projects, academic background, awards, and contact information across a small set of hand-authored HTML pages.

The project is built with plain HTML, CSS, and JavaScript. There is no framework, package manager, or build step.

## What is in this repo

- `index.html`: main landing page and portfolio overview
- `coop.html`: detailed HAECO co-op experience page
- `hackathon.html`: AWS AI Hackathon project showcase
- `policy.html`: policy, statement, and chatbot notice page
- `assets/css/`: shared and page-specific styles
- `assets/js/`: site behavior, translations, search, and assistant logic
- `assets/images/`: resume, portrait, logos, and gallery media
- `assets/videos/demo.mp4`: hackathon demo video
- `assets/bot/knowledge.json`: source copy of structured assistant knowledge
- `assets/js/assistant-knowledge.js`: embedded assistant knowledge for offline use

## Core features

- Responsive multi-page portfolio site
- Light and dark theme toggle saved in local browser storage
- Four-language UI: English, Traditional Chinese, Simplified Chinese, and Spanish
- Client-side section search with localized suggestions
- Embedded portfolio assistant backed by local embedded knowledge data
- Media galleries and lightbox interactions on detail pages
- No external runtime dependencies

## Local development

The assistant now reads embedded knowledge from `assets/js/assistant-knowledge.js`, so the site can still function when opened directly with `file://`.

Using a local HTTP server is still useful for normal browser testing, but it is no longer required for the assistant itself.

Example:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/coop.html`
- `http://localhost:8000/hackathon.html`
- `http://localhost:8000/policy.html`

## Project structure

```text
.
├── index.html
├── coop.html
├── hackathon.html
├── policy.html
└── assets
    ├── bot
    │   └── knowledge.json
    ├── css
    │   ├── chat.css
    │   ├── coop.css
    │   ├── hackathon.css
    │   ├── policy.css
    │   └── styles.css
    ├── images
    │   ├── CV
    │   ├── coop
    │   ├── hackathon
    │   └── logos
    ├── js
    │   ├── assistant-knowledge.js
    │   ├── assistant-engine.js
    │   ├── assistant.js
    │   ├── coop.js
    │   ├── hackathon.js
    │   ├── main.js
    │   ├── media-data.js
    │   ├── search.js
    │   ├── site-core.js
    │   └── translations.js
    └── videos
        └── demo.mp4
```

## How the site is organized

### Shared frontend layer

- `assets/css/styles.css` defines the shared visual system and layout
- `assets/js/site-core.js` contains reusable UI helpers such as scrolling, header behavior, and lightbox support
- `assets/js/main.js` powers shared page interactions including theme switching and section reveal behavior

### Page-specific behavior

- `assets/css/coop.css` and `assets/js/coop.js` support the co-op story page
- `assets/css/hackathon.css` and `assets/js/hackathon.js` support the hackathon showcase
- `assets/css/policy.css` styles the policy page

### Content systems

- `assets/js/translations.js` stores the localized copy used across the site
- `assets/js/assistant-knowledge.js` embeds assistant knowledge for direct file/offline usage
- `assets/js/search.js` builds the in-browser search index and localized suggestions
- `assets/js/assistant.js` powers the chatbot UI shell and legacy fallback logic
- `assets/js/assistant-engine.js` handles local retrieval, summaries, and response composition
- `assets/js/media-data.js` holds structured media metadata for gallery rendering
- `assets/bot/knowledge.json` stores the structured knowledge source data

## Editing guide

### Update page copy

- Edit the relevant HTML page for structure and non-translated markup
- Edit `assets/js/translations.js` for anything controlled by `data-i18n`

### Add or change the onsite assistant

- Update `assets/js/assistant-knowledge.js` for the runtime assistant dataset used by browsers
- Update `assets/bot/knowledge.json` if you want to keep the source copy of the structured knowledge in sync
- Update `assets/js/assistant-engine.js` for retrieval scoring, summaries, and response composition
- Update `assets/js/assistant.js` for chat UI behavior, fallback responses, and interaction wiring
- Update `assets/css/chat.css` when the assistant interface needs visual changes

### Update search behavior

- Edit `assets/js/search.js` to adjust aliases, canned suggestions, or indexed content

### Add media

- Place new files in the appropriate folder under `assets/images/` or `assets/videos/`
- Update `assets/js/media-data.js` when gallery content needs metadata such as labels and captions

### Change styling

- Use `assets/css/styles.css` for shared design changes
- Use the page-specific stylesheet when the change is isolated to one page

## Notes

- The site is fully static; deployment can be done on any simple static host
- Theme and language choices are saved in local browser storage and restored on reload
- The assistant can run from a direct file open because its knowledge is embedded in JavaScript
- Opening the site through a server is still the safest way to verify the full site behavior across browsers

## Assistant notes

The portfolio assistant is part of the main site, not a separate package. Its runtime behavior depends on:

- `assets/js/assistant.js` for UI and interaction logic
- `assets/js/assistant-knowledge.js` for embedded offline knowledge
- `assets/js/assistant-engine.js` for retrieval and composition logic
- `assets/bot/knowledge.json` for the source copy of structured knowledge
- `assets/js/translations.js` for multilingual assistant labels and copy
- `assets/css/chat.css` for chat styling
