# Registry

This directory is the boolstack app registry: a set of ready-made, single-file HTML apps that users can browse and add to their own boolstack.

## How it works

- Every `*.html` file in this directory is an app. Other files (like this README) are ignored.
- The directory is read at build time and emitted as static files, so adding or removing files changes what users see after the next build. `next dev` picks up changes on reload.
- When a user adds an app, it is **cloned** into their local database. Removing a file here never affects users who already added it.
- Users can rename and restyle their copy freely.
- Previewing an app saves nothing.

## File naming

Filenames must match `[a-z0-9][a-z0-9_-]*.html`. The filename without the extension is the app's slug, e.g. `workout-plan.html` has the slug `workout-plan`.

## Metadata

App metadata is read from the HTML `<head>`. All tags are optional:

```html
<title>Workout Plan</title>
<meta name="description" content="Strength program tracker for bench press and curls with a per-session log.">
<meta name="boolstack:icon" content="IconBarbell">
<meta name="boolstack:color" content="#7aa2ff">
<meta name="boolstack:variant" content="1">
<meta name="boolstack:mobile-variant" content="2">
```

| Source | Meaning | Default |
| --- | --- | --- |
| `<title>` | App name | Humanised slug |
| `description` | Short summary | none |
| `boolstack:icon` | Tabler icon name from `@tabler/icons-react` | `IconApps` |
| `boolstack:color` | Hex colour | Hashed from the slug |
| `boolstack:variant` | Desktop card style, 1-8 | `1` |
| `boolstack:mobile-variant` | Mobile icon style, 1-6 | `1` |

## Rules for apps

- Apps must be self-contained. Core function must not depend on external JS or CSS. Google Fonts and similar are fine as cosmetic extras.
- `localStorage` is fine to use freely. It is namespaced per app and synced to the user's database once they own a copy. In preview, it is an in-memory shim.
