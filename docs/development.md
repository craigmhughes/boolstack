# Development

## Setup

Requirements: Node.js 20+, [pnpm](https://pnpm.io/installation), and a Chromium-based browser (Chrome or Edge) to test backups.

```bash
git clone https://github.com/craigmhughes/boolstack.git
cd boolstack
pnpm install
pnpm dev
```

Open the HTTPS URL printed in the terminal.

## HTTPS in development

`pnpm dev` runs `next dev --webpack --experimental-https`. Browser APIs Boolstack relies on (File System Access, service workers, storage persistence) need a secure context, so the dev server runs over HTTPS.

On first run, if `certificates/` is missing, Next.js downloads [mkcert](https://github.com/FiloSottile/mkcert), creates a local root CA (on Windows in `%LOCALAPPDATA%\mkcert`), and writes `localhost.pem` and `localhost-key.pem` into `certificates/` in the project root. This directory is git-ignored and must never be committed. Next.js may prompt for your password to install the local CA into your system trust store. If you decline or it is not installed, the server still starts, but your browser or `curl` will warn about the certificate until you run `mkcert -install` (or accept the warning).

`http://localhost` is also a secure context, so if you do not need HTTPS you can run `pnpm exec next dev --webpack` instead.

The service worker is only registered in production builds; in development any existing one is unregistered. To test PWA behaviour use `pnpm build && pnpm start`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server (webpack, HTTPS) |
| `pnpm build` | Production build (webpack) |
| `pnpm start` | Serve the static build in `out/` |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |

Run `pnpm lint`, `pnpm typecheck` and `pnpm build` before opening a pull request.

## Next.js version

This project uses Next.js 16, which has breaking changes from earlier versions. When in doubt, read the guides shipped with the installed package in `node_modules/next/dist/docs/` rather than relying on older documentation. [AGENTS.md](../AGENTS.md) tells AI coding tools to do the same.

## Resetting local data

Data lives in the browser (IndexedDB database `artifact-hub-db`, plus `localStorage` keys starting with `__bs_`) and in your backup folder's `backup.tar.gz`. To start fresh, clear the site data for the dev origin in your browser and delete or move `backup.tar.gz`; otherwise it is restored on next start.

## Guide screenshots

The user guide (`content/user-guide.md`, rendered at `/guide`) uses images in `public/guide/*.webp`. If you change the UI they show, update them, and make sure screenshots contain no personal data.

## Conventions

- TypeScript, React 19, Tailwind CSS 4, shadcn/ui primitives in `components/ui/`.
- Build-time-only code is limited to `app/lib/registry.ts` and `app/registry/` (static route handlers). Do not import them from client components. The site is a static export: no request-dependent handlers, server actions or middleware.
- Accessibility target is WCAG 2.2 AA: keyboard operation, visible focus, labelled controls, reduced-motion support, and announcements through `LiveStatus` for async state changes.
