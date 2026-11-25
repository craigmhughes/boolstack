# Deployment

Boolstack must run on a Node.js server. The registry API (`app/api/registry/*`) reads `registry/*.html` from disk at request time, so a host without a Node runtime and filesystem does not work.

Static export (`output: "export"`) is **not supported** because of the API routes.

For general self-hosting concerns (reverse proxy, caching, environment variables, multi-instance setups) see the guides shipped with the installed Next.js: `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` and `node_modules/next/dist/docs/01-app/02-guides/deploying-to-platforms.md`. This project uses Next.js 16, which differs from older versions, so read the docs for the installed version.

## HTTPS is required

Serve production over HTTPS. The service worker, installable PWA, persistent storage and File System Access API all need a secure context (`http://localhost` also counts, for local testing). No environment variables are required.

## Node server

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start          # listens on port 3000 by default
```

Run it behind a reverse proxy (nginx, Caddy, etc.) that terminates TLS, as the Next.js self-hosting guide recommends. The registry is read from `process.cwd()/registry`, so start the server from the project root with `registry/` present.

Because the registry is read at request time, you can add or remove files in `registry/` on a running server without rebuilding.

## Docker

The default build output is not standalone. To produce a minimal image, set `output: "standalone"` in `next.config.ts` (keep the existing `outputFileTracingIncludes`, which makes sure `registry/` is traced) and build. Per the Next.js docs, the standalone `server.js` does not copy `public` or `.next/static` by default, so the image copies them in.

Example `Dockerfile` (an untested starting point):

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/registry ./registry
EXPOSE 3000
CMD ["node", "server.js"]
```

To add registry apps without rebuilding, mount a volume over `/app/registry`.

## Vercel

Vercel runs Next.js with Node.js functions, and `outputFileTracingIncludes` bundles `registry/**/*` into the registry routes. Import the repository and deploy with the default settings; Vercel provides HTTPS. Adding registry apps there requires a redeploy. This path has not been verified by the maintainers.

## Data and upgrades

All user data lives in each user's browser and backup folder, not on the server, so deploying a new version never touches it. The server holds only the app code and the registry.
