# Ken Portfolio V2

One-page portfolio built with Astro, React, Motion, and Cloudflare Workers.
The homepage combines an interactive systems map with an editorial résumé,
while preserving the existing blog, knowledge base, tools, and Ask Ken widget.

## Local development

```bash
npm install
npm run dev
```

Quality and production checks:

```bash
npm run check
npm run build
npx wrangler deploy --dry-run
```

## Deployment

`wrangler.jsonc` serves the static Astro output from `dist/`. The Worker handles
only `/api/*`; other requests are delegated to Cloudflare Static Assets.

```bash
npm run deploy
```

## Ask Ken

The browser sends Chatbot requests to the same-origin `/api/chat` endpoint.
`worker/index.ts` validates and forwards those requests to the existing
Lambda-backed assistant. This avoids exposing the Lambda CORS restriction to
the frontend and keeps the upstream address out of the UI configuration.

## Design source

The accepted 4 + 1 design direction and implementation rules are documented in
`design-system/ken-portfolio-v2/pages/home.md`.
