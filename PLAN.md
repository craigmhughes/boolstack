# Implementation Plan: Local-First Artifact Backup Vault

This guide outlines the development process to build, test, and refine your sandboxed, local-first backup architecture. Follow this step-by-step sequence to isolate and master each browser API individually.

---

## Phase 1: The Core Data Engine
*Objective: Set up the background Web Worker and database schema on your local machine using standard browser storage.*

### Step 1: Define the Sync Schema
* Design a single SQLite table layout optimized for multi-app storage.
* Include fields: `namespace TEXT`, `key TEXT`, `value TEXT`, and `updated_at INTEGER`.
* Add a composite primary key on `(namespace, key)` to allow seamless upserts using `INSERT OR REPLACE`.

### Step 2: Initialize the Web Worker
* Set up the `@sqlite.org/sqlite-wasm` package inside a standard browser Web Worker.
* To avoid early permission hurdles, initialise it using the temporary **in-memory VFS** or standard **IndexedDB VFS driver** to confirm the WebAssembly binaries load correctly.

### Step 3: Write the Ingestion Logic
* Implement the `onmessage` listener in the worker to accept data payloads.
* Write a test script that passes mock `localStorage` key-value dumps to the worker.
* Verify the worker successfully writes and queries these logs within the database.

---

## Phase 2: The Security Boundary (iFrame Bridge)
*Objective: Establish secure, unthrottled communication between your sandboxed mini-apps and the parent app wrapper.*

### Step 1: Build the Parent Wrapper
* Create a simple HTML interface that embeds a test mini-app via an `<iframe>`.
* Configure the `sandbox` attribute carefully, ensuring you include `allow-scripts` and `allow-same-origin` to allow data-sharing capabilities.

### Step 2: Inject the LocalStorage Interceptor
* Create a lightweight JavaScript snippet that overrides the native `localStorage.setItem` method inside the iFrame.
* Wire this interceptor to broadcast changes to the parent window using `window.parent.postMessage()`, appending a unique `namespace` ID based on the specific artifact.

### Step 3: Implement the Debouncer
* Write a high-performance debouncer in the parent window using a 1–2 second timer or `requestAnimationFrame`.
* Group rapid-fire `postMessage` writes from the iFrame into a single structured batch object before sending them down to the SQLite Worker.

---

## Phase 3: The Persistent Vault (File System Access)
*Objective: Connect your SQLite data engine directly to your physical hard drive with persistent, zero-prompt permissions.*

### Step 1: Implement the Initial Picker
* Create an "Initialize Backup Vault" button in your parent application UI.
* Trigger `window.showSaveFilePicker()` when clicked to let you choose or create a physical `.db` file on your host machine.

### Step 2: Cache the File Handle
* Instantly save the returned `FileSystemFileHandle` object into **IndexedDB** so the app remembers the exact file location across browser restarts.

### Step 3: Upgrade to OPFS & Native Sync
* Switch your SQLite worker initialization to use the official **OPFS driver** (`OpfsDb`).
* Write a pipeline function: whenever the SQLite worker finishes executing a debounced batch transaction, it reads the raw DB binary array from OPFS and streams it directly into your host machine's persistent file handle.

---

## Phase 4: PWA Packaging & UX Refinement
*Objective: Wrap the application into a Progressive Web App to unlock the zero-prompt permission bypass.*

### Step 1: Add PWA Manifest and Service Worker
* Create a standard `manifest.json` defining your application as a standalone desktop app.
* Register a basic Service Worker to cache your parent app shell, iFrame runner assets, and SQLite WebAssembly files for true offline availability.

### Step 2: Code the "Silent" Startup Permission Check
* Write a boot routine that triggers every time the app opens.
* Fetch the file handle from IndexedDB, and run `await handle.requestPermission({ mode: 'readwrite' })`. 
* Test this inside a normal browser tab (it should prompt you) versus installing it as a PWA (it should grant access completely silently).

### Step 3: Implement the Reverse-Hydration Check
* Write the restoration code: when a mini-app boots up, check if its `localStorage` is completely empty.
* If empty, have the parent query the SQLite database for that specific namespace, fetch the keys, and use `postMessage` to inject them back into the iFrame's `localStorage` before the user interacts with it.

---

## Phase 5: Open-Source & Stress Testing
*Objective: Break the app locally to ensure it is bulletproof for power users before opening the repository.*

### Step 1: Simulate Browser Clears
* Intentionally go to your browser settings and hit "Clear Site Data" or delete browser cookies.
* Open your PWA, verify it handles the broken link gracefully, and test re-linking to your external `.db` file to watch your data instantly restore.

### Step 2: Simulate File Sync Collisions
* Place your backup file into a Dropbox or OneDrive folder.
* Try modifying data while running a local network throttling script to see how your JavaScript file writer behaves if the cloud client temporarily locks the file.
