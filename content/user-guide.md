# Boolstack User Guide

This guide shows how to take the small apps an AI assistant builds (a habit tracker, a budget calculator, a flashcard deck) and keep them all in one place.

**Prerequisites:** a Chromium-based browser (such as Chrome or Edge). No coding is needed. If you can download a file and click a button, you can follow this guide.

## What Boolstack does

Some AI tools, like Claude, ChatGPT and others, already let you save "artifacts" or apps inside their own product. That works well when you only use one assistant.

Boolstack is for when you use several:

- **One roof for every agent.** Built something in Claude, something else in ChatGPT, another in Gemini? They all end up in the same dashboard.
- **You own the files.** Each app is a plain HTML file. No account, no subscription, no vendor holding your tools.
- **Your data stays on your device.** Apps save to your own browser storage, and Boolstack backs it up to a folder you choose.

![Your apps on the Boolstack dashboard](/guide/apps-grid.webp)

## Step 1: First-time setup

The first time you open Boolstack you'll see a short setup screen. It asks you to pick a folder for backups, so your apps and their saved data survive if your browser clears itself.

![The setup screen](/guide/setup-intro.webp)

Pick a folder you trust (a synced folder like Documents is a good choice). You can skip this step, but then your apps live only in this browser. If you clear your browser data, they are gone.

## Step 2: Get an app from your agent

Ask your AI assistant to build your idea, using the prompt in the next section. It should give you a single block of code, or a downloadable `.html` file.

If it gives you code, save it:

1. Open Notepad (Windows) or TextEdit (Mac, set to plain text).
2. Paste the code.
3. Save it as something like `my-app.html`. The name must end in `.html`.

## The golden rules

Boolstack runs your app in a safe, sandboxed window. For everything to work, your app must follow these rules:

| Rule | Why it matters |
| --- | --- |
| **One single `.html` file** | Boolstack stores one file per app. |
| **All CSS and JavaScript inside that file** | No separate `.css` or `.js` files. They won't be found. |
| **Save data with `localStorage` only** | This is the one storage Boolstack backs up for you. |
| **No logins, servers, databases or online APIs** | Apps are self-contained and must work with no internet. |

### localStorage only, in plain words

`localStorage` is a small notebook your app keeps inside the browser. Boolstack gives every app its own private page in that notebook, so two apps can never read each other's data, and it copies each page to your backup folder.

Other storage options, such as cookies, `sessionStorage` or `IndexedDB`, are **not** backed up. If your agent uses them, your data can vanish. The prompt below tells the agent to use `localStorage` and nothing else.

A few limits to know about:

- It stores text only. Agents handle this by converting data to JSON.
- You get roughly 5 MB per app. That's plenty for notes, lists and logs, but not for photos.
- The app's name is its storage namespace, so each app name must be unique.

## The prompt to give your agent

Copy this whole block and paste it into your AI assistant. Then add your idea on the last line.

```
Build me a small app as a SINGLE, self-contained HTML file that I can upload to Boolstack. Follow these rules exactly:

1. One file only. Put all HTML, CSS and JavaScript in that one file. No external CSS, JS, fonts, images, CDNs or frameworks loaded from the internet. It must work fully offline.
2. Save ALL user data with window.localStorage ONLY. Do not use sessionStorage, cookies, IndexedDB, Web SQL, or any server or API. Store data as JSON strings (JSON.stringify / JSON.parse), wrap reads and writes in try/catch, and fall back to sensible defaults if nothing is saved or the data is corrupt. Load saved data when the page starts and save every time the data changes.
3. No logins, accounts, network requests, fetch/XMLHttpRequest calls, or analytics.
4. Make it responsive so it works on a phone and a desktop, with large tap targets and readable text. Use good colour contrast and label every button and input so it is accessible.
5. Use a clean, modern look. A dark or light theme is fine.
6. Include in the <head>: a <title> with the app name, and <meta name="description" content="one short sentence about the app">.
7. Do not use alert() for normal feedback. Show messages on the page.
8. Give me the complete file in one single code block that I can save as app-name.html. Do not split it into several files and do not leave any placeholders like "add your code here".

My idea is:
[DESCRIBE YOUR APP HERE]
```

> **Tip:** if the first version isn't right, just tell the agent what to change and ask for the full updated file again. Keep the rules in the conversation so it doesn't forget them.

## Step 3: Add your app to Boolstack

1. On the dashboard, click the round **+** button in the bottom-right corner.
2. Choose **New app**.

![The add button menu](/guide/fab-menu.webp)

3. Give it a **name** and a short **description**.
4. Click the file box and choose your `.html` file.
5. Pick an **icon**, a **colour**, and a card style you like. The preview updates as you go.
6. Click **Add app**.

![Adding an app](/guide/add-dialog-filled.webp)

Your app now appears on the dashboard. Click it to open it.

![An app running inside Boolstack](/guide/running-app.webp)

### Prefer to start from a ready-made app?

Choose **Import from registry** in the same menu. It lists ready-to-use apps. Preview one, and add it to your dashboard in one click.

![The registry](/guide/registry-browser.webp)

## Your data is saved automatically

Use your app as normal. Everything you type is saved as you go, and it's still there next time you open the app. Boolstack also copies it to your backup folder shortly after each change.

![Saved data inside an app](/guide/persisted-data.webp)

## Updating or deleting an app

Each app card has edit and delete options. When editing you can change the description, icon and colours, and you can **replace the HTML file** with a newer version your agent made. The app's name can't be changed after creating it, because the name is what links the app to its saved data. Replacing the file keeps that data.

![Editing an app](/guide/edit-dialog.webp)

Deleting an app also deletes its saved data, so Boolstack asks you to confirm first.

## On your phone

Boolstack works on mobile too. Apps show up as tidy icons.

![Boolstack on a phone](/guide/mobile-launcher.webp)

## Something not working?

**My app opens but forgets everything.**
It probably doesn't use `localStorage`. Ask your agent: "Make this app save everything with localStorage only, and give me the full file."

**It looks plain or broken.**
It likely loads styles or scripts from the internet. Ask the agent to put all CSS and JavaScript inside the single HTML file.

**Boolstack says the name already exists.**
Every app needs a unique name. Add a number or a word to make it different.

**I can't pick my file.**
The file must end in `.html`. Check that your text editor didn't save it as `.html.txt`.

**My data disappeared.**
Check that you chose a backup folder in setup, and that you haven't cleared your browser's site data.
