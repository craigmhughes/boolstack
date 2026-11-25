# Registry

The registry is a set of ready-made single-file HTML apps in the [`registry/`](../registry) directory. Users browse it from the launcher (**Import from registry**), preview an app, and add it to their own library.

## How it works

- Every `*.html` file in `registry/` is an app. Other files (such as its README) are ignored.
- The directory is read at request time by `GET /api/registry` and `GET /api/registry/[slug]`.
- Adding an app **clones** its HTML into the user's local database. Removing or changing a file later does not affect users who already added it.
- Previewing runs the app in a stricter sandbox with in-memory storage, and saves nothing.

## File naming

Filenames must match `[a-z0-9][a-z0-9_-]*.html`. The filename without `.html` is the slug (`workout-plan.html` has the slug `workout-plan`).

## Metadata

Metadata is read from the HTML `<head>`. All tags are optional:

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
| `boolstack:color` | Hex colour (`#rgb` or `#rrggbb`) | Picked from a palette by hashing the slug |
| `boolstack:variant` | Desktop card style, 1-8 | `1` |
| `boolstack:mobile-variant` | Mobile icon style, 1-6 | `1` |

## Rules for apps

- **Single file.** All HTML, CSS and JavaScript in one `.html` file.
- **Self-contained.** Core function must not depend on external JS or CSS. Web fonts from a font CDN are acceptable as a cosmetic extra only (the existing sample apps load Google Fonts this way); the app must still work without them.
- **Storage.** Use `localStorage` only. It is namespaced per app and synced to the user's database once they own a copy. Other storage (cookies, `sessionStorage`, IndexedDB) is not backed up, and in preview is not persisted.
- **No** logins, server calls, analytics or network APIs.
- **Accessible.** Responsive layout, readable contrast, labelled controls, keyboard operable.
- **Original work.** Submit only code you wrote or have the right to license under this project's [MIT license](../LICENSE).

The [user guide](../content/user-guide.md) contains a prompt that produces apps following these rules.

## Submitting an app

1. Fork the repository and add your file to `registry/`.
2. Run `pnpm dev`, open **Import from registry**, check the preview, then add the app and use it. Check that data survives a reload.
3. Open a pull request, following [CONTRIBUTING.md](../CONTRIBUTING.md).
