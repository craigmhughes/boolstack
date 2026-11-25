# Deployment

Boolstack is a static site. `next build` (`output: "export"` in `next.config.ts`) writes the whole site to `out/`, which any static host can serve. No Node runtime is needed in production.

The registry is baked in at build time: `registry/*.html` becomes `out/registry/<slug>.html`, plus `out/registry/index.json`. **Adding or removing a registry app requires a rebuild and redeploy.**

## HTTPS is required

Serve production over HTTPS. The service worker, installable PWA, persistent storage and File System Access API all need a secure context (`http://localhost` also counts, for local testing). No environment variables are required.

## Build

```bash
pnpm install --frozen-lockfile
pnpm build          # writes the site to out/
```

Preview locally with any static server, for example `npx serve out`.

## Hosting

Upload or point your host at `out/`. Serve it from the **domain root** (`/`): the service worker, manifest and registry fetches use root-absolute paths, so sub-path hosting (for example `user.github.io/repo/`) is not supported without adding `basePath` and updating those paths.

Examples: Netlify, Cloudflare Pages, Vercel (static), GitHub Pages with a custom domain, S3 + CDN, or nginx/Caddy serving `out/`.

For static-export details see `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`. This project uses Next.js 16, which differs from older versions, so read the docs for the installed version.

## Data and upgrades

All user data lives in each user's browser and backup folder, not on the server, so deploying a new version never touches it. The host serves only static files.
