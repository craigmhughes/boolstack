# Contributing to Boolstack

Thanks for your interest. Bug reports, ideas, docs fixes, registry apps and code are all welcome. Contributions are licensed under the project's [MIT license](LICENSE).

## Getting started

```bash
git clone https://github.com/<your-fork>/boolstack.git
cd boolstack
pnpm install
pnpm dev
```

See [docs/development.md](docs/development.md) for HTTPS setup and other details, and [docs/architecture.md](docs/architecture.md) for how the app fits together.

## Reporting bugs and requesting features

Open a GitHub issue. For a bug, include your browser and version, what you did, what you expected and what happened. Search existing issues first. For security problems do **not** open a public issue; see [SECURITY.md](SECURITY.md).

## Pull requests

1. Open an issue first for anything large, so we can agree on direction.
2. Branch from `main` (for example `fix/backup-permission` or `feat/export-all`).
3. Keep changes focused: one concern per pull request.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for messages, as in the existing history: `feat: ...`, `fix: ...`, `fix(a11y): ...`, `chore: ...`, `docs: ...`.
5. Before pushing, run:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

6. Describe what changed and why, and how you tested it. Include screenshots for UI changes.

### Checklist

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` pass
- [ ] Works in a Chromium browser; no regressions to backup and restore
- [ ] Accessible: keyboard operable, visible focus, labelled controls, sufficient contrast, respects reduced motion (WCAG 2.2 AA)
- [ ] Docs updated if behaviour changed (and `CHANGELOG.md` for user-visible changes)
- [ ] No secrets, personal data, or generated certificates committed
- [ ] New dependencies are justified and their licenses are compatible with MIT

## Registry apps

To contribute a sample app, follow [docs/registry.md](docs/registry.md): a single self-contained `.html` file in `registry/`, with metadata in the `<head>`, `localStorage` only, and original work you can license under MIT. Please test it through the registry preview and after adding it to a library.

## AI coding tools

[AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) are included for contributors who use AI coding assistants. They point tools at the Next.js documentation matching the installed version, which has breaking changes from earlier releases. AI-assisted contributions are fine, but you are responsible for understanding, testing and standing behind what you submit.
