# Sync — Claude Code Master Prompt

You are building **Sync**, a personal cross-device clipboard vault with AI-powered folder intelligence. Read this entire file before writing a single line of code. Then read all other `.md` files in this folder.

---

## What you are building

A PWA (Progressive Web App) that acts as a persistent, intelligent clipboard across mobile, tablet, and laptop. The user captures anything — text, images, files, Drive links, videos — from any device. Everything lands in a unified vault. The vault is organized into folders. Each folder has a built-in AI chat that has direct access to all content inside it, including live Google Drive documents via the Drive API.

This is not a file manager. This is not a notes app. It is a **context-aware capture and retrieval layer** for a person's daily work.

---

## Core principles

- **Capture first, organize later.** Nothing should require the user to decide where something goes at the moment of saving.
- **AI does the filing.** Every item saved is automatically described and assigned a suggested folder by Claude API.
- **Folders are workspaces.** A folder is not just a container. It is a context. The AI chat inside a folder knows everything in that folder.
- **PWA only.** No native app. No App Store. Runs in Safari on iOS/iPadOS and in Chrome on desktop. Add to Home Screen for app-like experience.
- **One account, all devices.** Google OAuth ties everything together. Supabase Realtime syncs across open sessions instantly.

---

## What NOT to build

- No social features
- No sharing with other users
- No commenting or collaboration
- No complex permissions system
- No paid tiers or paywalls
- No onboarding flows longer than 2 screens

---

## File structure of this project

Read these files in order before starting:

1. `claude.md` — this file, master context
2. `architecture.md` — full system design, data model, API contracts
3. `features.md` — every feature with acceptance criteria
4. `techstacks.md` — exact libraries, versions, and setup commands
5. `uispec.md` — screens, layout, component breakdown
6. `aispec.md` — all Claude API calls, prompts, and expected outputs
7. `googledocspec.md` — Drive OAuth flow, file reading, context injection
8. `buildorder.md` — exact sequence to build in, hour by hour

---

## The user

Single person. Three devices: Android phone, iPad, Windows laptop. Uses Google account. Works in product management and AI consulting. Daily workflows include job applications, client deliverables, and research. Loses time searching for saved paragraphs, resume links, and project docs scattered across WhatsApp, email, Drive, and browser tabs.

---

## Definition of done

The app is complete when:
- A user can save text, image, file, or Drive link from any device
- It appears in the vault feed on all other open devices within 3 seconds
- AI has auto-described and suggested a folder for every item
- User can create folders and move items into them
- Inside a folder, the AI chat can answer questions using all folder content including live Drive docs
- The app is installable via Safari "Add to Home Screen" on iOS
- Search works by keyword, date, and type
- Google Drive OAuth connects in one click and persists