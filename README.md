# boolstack

boolstack is a local-first admin panel for your personal single-file HTML apps. Apps are stored in a browser-side PGlite database, and the whole library is backed up to a folder you choose on your machine.

## Requirements

- A Chromium-based browser (Chrome, Edge, etc.). Folder backups use the File System Access API, which other browsers do not support.
- [pnpm](https://pnpm.io/installation)

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Next.js dev server with `--experimental-https`, so open the HTTPS URL it prints.

## Backups

Pick a folder in the storage settings. boolstack writes a `backup.tar.gz` file into that folder, and restores from it on the next start.

## Per-app localStorage

Each app's iframe `localStorage` is namespaced with the prefix `__bs_{encodeURIComponent(appName)}_`. Those keys are synced into the `namespaced_local_storage` table in the database. When an app opens with empty storage, its values are rehydrated from the database.

## Adding an app

Apps are self-contained `.html` files. Do not reference external assets (scripts, stylesheets, fonts, images) by URL; inline everything the app needs so it works offline.
