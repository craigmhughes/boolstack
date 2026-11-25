# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/).

## [0.1.0]

First public release.

### Added

- Launcher dashboard for single-file HTML apps, with a mobile icon layout.
- Add, edit (including replacing the HTML file) and delete apps, with custom icon, colour and card style.
- Local-first storage in a browser-side PGlite database.
- Folder backup and restore through `backup.tar.gz` (File System Access API).
- Per-app namespaced `localStorage`, synced into the database and rehydrated from it.
- Sandboxed iframe viewer for apps.
- Registry of sample apps with preview (nothing saved) and one-click add, served from `registry/`.
- Installable PWA with an app-shell service worker and a persistent-storage request.
- First-run intro and setup flow.
- In-app user guide at `/guide`.
- Accessibility work targeting WCAG 2.2 AA.
