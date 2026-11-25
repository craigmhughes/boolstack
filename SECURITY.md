# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately using GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability** (a private security advisory). Please do not open a public issue or pull request for security problems.

Include what you found, steps to reproduce, the affected version or commit, and the impact you expect. This is a small project, so please be patient; you will get a response as soon as the maintainer is able. Once a fix is available the advisory will be published, and you will be credited if you wish.

## Supported versions

Only the latest release on `main` is supported.

## Scope and threat model

Boolstack runs HTML files that **you** choose to add, in sandboxed iframes, in your own browser. Understand the model before reporting:

- Apps run with `sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"`. `allow-same-origin` is needed for `localStorage`, so an app shares the launcher's origin. A malicious app could therefore read or tamper with other data in that origin (including other apps' `localStorage` and the launcher's IndexedDB). Key namespacing separates well-behaved apps; it is not a security boundary against hostile ones. **Only add apps you trust.**
- Registry previews use a stricter sandbox without `allow-same-origin`, and a memory-only storage shim.
- All user data stays in the browser and the backup folder you choose. The host holds no user data; it serves static files, including the build-time `registry/` snapshot.

In scope: bugs that let a registry preview or other untrusted content break out of its sandbox further than described above, path traversal or file disclosure through the registry build step, cross-site scripting in the launcher itself, and flaws in backup and restore handling.

Out of scope: a trusted-but-malicious app abusing the same-origin model described above, vulnerabilities in third-party dependencies with no demonstrated impact here (report those upstream), and issues requiring a compromised browser or machine.
