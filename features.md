# FEATURES.md — Sync Feature Specifications

Features are split into **v1 (build now)** and **coming soon (UI placeholder only)**. Build the UI for all features. Only wire up backend for v1 features.

---

## V1 Features — Build fully (frontend + backend)

---

## F1 — Google Auth

**Description:** User signs in with Google. One account works across all devices.

**AC:**
- Sign in with Google button on landing page
- On success, redirect to vault feed
- Session persists across browser closes (Supabase session storage)
- Sign out clears session and redirects to landing

---

## F2 — Vault Feed

**Description:** Chronological feed of all captured items. Most recent first.

**AC:**
- Shows all items for the logged-in user
- Each item card shows: type icon, content preview, AI description (skeleton until loaded), timestamp, source device, folder badge, star button
- New items appear at top in real time without page refresh (Supabase Realtime INSERT)
- AI description updates in place without page refresh (Supabase Realtime UPDATE)
- Infinite scroll or "load more" for older items (paginate 20 at a time)
- Empty state with clear instructions on how to add first item

---

## F3 — Capture: Text

**Description:** Save any text or paragraph directly from the app.

**AC:**
- Floating "+" button opens a capture modal
- Text tab: multiline textarea, no character limit
- On save: item created in DB instantly, item appears in feed within 1 second
- AI categorization triggered in background (does not block save or feed display)

---

## F4 — Capture: Image

**Description:** Upload an image from device.

**AC:**
- Image tab in capture modal
- File picker accepts jpg, png, gif, webp
- Max 25MB enforced with clear error message
- Image uploaded to Supabase Storage, URL stored in item
- Thumbnail shown in feed card

---

## F5 — Capture: File

**Description:** Upload any file (PDF, DOCX, XLSX, etc.)

**AC:**
- File tab in capture modal
- Accepts any file type
- Max 25MB enforced
- File uploaded to Supabase Storage
- Feed card shows: filename, file size, file type icon, download button

---

## F6 — Capture: Link

**Description:** Save any URL with optional title.

**AC:**
- Link tab in capture modal
- URL field (required) + Title field (optional)
- Feed card shows clickable link with title and domain
- Auto-detect if URL is a Google Drive URL and switch to Drive tab

---

## F7 — Capture: Google Drive Link

**Description:** Save a Google Drive link. App stores the file ID for future live reading.

**AC:**
- Drive link tab in capture modal (or auto-detected when URL matches drive.google.com)
- App extracts file ID from URL
- Stores `drive_file_id` in item row
- Feed card shows Google Drive icon, URL/title, "Open in Drive" button
- Note on card: "Live reading coming soon"

---

## F8 — Capture: Video Link

**Description:** Save YouTube or any video URL.

**AC:**
- Auto-detected when URL matches youtube.com or youtu.be
- Stores as video_link type
- Feed card shows video title and link
- Transcript fetching: coming soon

---

## F9 — AI Auto-Categorization (async, non-blocking)

**Description:** Every item saved is automatically described and assigned a suggested folder by OpenAI.

**AC:**
- Item save and feed display completes in under 1 second — AI does not block this
- API call fires after item is saved: `POST /api/categorize` (Next.js route, server-side OpenAI)
- When result arrives (3–5 sec): item row updated with `ai_description` and `ai_suggested_folder`
- Feed card updates automatically via Realtime UPDATE subscription — no page refresh
- If suggested folder matches an existing folder name (case-insensitive): show "Move to [folder]?" toast
- User can accept or dismiss the suggestion
- On any error: fail silently. Item was already saved.

---

## F10 — Folders

**Description:** User-created workspaces for organizing items.

**AC:**
- "New Folder" button in sidebar
- Folder requires a name (required), description (optional), color picker (6 preset colors)
- Folders listed in left sidebar on desktop, bottom nav "Folders" tab on mobile
- Clicking folder shows only items in that folder
- Item count shown next to folder name
- Folder can be renamed or deleted (items move back to unassigned on delete)

---

## F11 — Move Item to Folder

**Description:** Assign any item to a folder.

**AC:**
- Three-dot menu on item card: "Move to folder"
- Shows list of existing folders
- Item updates immediately in UI (optimistic update)
- Can also move from item detail view

---

## F12 — Search

**Description:** Search across all vault items.

**AC:**
- Search bar at top of vault feed
- Searches across: `content`, `ai_description`, `file_name`, `link_title`, `drive_file_title`
- Filter by type: All | Text | Image | File | Link | Drive | Video
- Filter by folder (dropdown)
- Results update as user types (debounced 300ms)
- Shows result count and "No results" empty state

---

## F13 — Star / Pin Items

**Description:** User can star items to quickly surface important ones.

**AC:**
- Star (★) button on every feed card
- Toggles `is_starred` boolean in DB
- "Starred" section in sidebar shows only starred items
- Star state updates immediately (optimistic)

---

## F14 — PWA Install

**Description:** App is installable on all devices without App Store.

**AC:**
- Valid `manifest.json` with icons
- Service worker registered
- On iOS Safari: "Add to Home Screen" works and opens app in standalone mode
- On Chrome desktop: install prompt appears or instructions shown
- App icon shows on home screen / desktop

---

## F15 — Settings Page

**Description:** Account management and app settings.

**AC:**
- Account section: profile photo, name, email, sign out
- Google Drive section: "Coming Soon" UI placeholder
- Export section: "Coming Soon" UI placeholder
- Danger Zone: "Delete all my data" with confirmation

---

## F16 — Item Detail View

**Description:** Full-screen/panel view of any item.

**AC:**
- Click any feed card to open detail view (right panel on desktop, full-screen on mobile)
- Shows: full content, AI description, type, source device, created date, current folder
- Actions: Move to folder, Star/Unstar, Copy content, Download (for files/images), Delete
- For Drive links: "Open in Drive" button (works) + "Read latest content" (coming soon badge)
- For images: full-size preview

---

## F17 — Delete Item

**Description:** Remove an item from the vault.

**AC:**
- Delete available from item detail view and context menu
- Confirmation dialog before delete
- Deletes item row from DB
- If file/image: deletes from Supabase Storage too
- Removed from feed immediately (optimistic)

---

## Coming Soon Features — UI only, no backend in v1

---

## CS1 — Folder AI Chat

**Description:** AI chat inside a folder, using folder content as context.

**UI to build now:**
- "Ask AI" tab on folder page
- Full chat UI: message list, input box, context summary bar showing item count
- "Connect Drive to include your Docs" prompt (disabled)
- Disabled input with placeholder: "AI chat coming soon"
- Coming Soon badge

**Backend:** `POST /api/folder-chat` — implement later (see AI_SPEC.md)

---

## CS2 — Google Drive OAuth + Live Reading

**Description:** Connect Drive account for AI to read linked Google Docs.

**UI to build now:**
- "Connect Google Drive" section in Settings with Coming Soon badge
- "Live reading coming soon" note on drive_link feed cards
- "Read latest content" button on drive_link item detail (disabled, Coming Soon)
- Drive doc count in folder AI chat context bar (shows 0, Coming Soon label)

**Backend:** OAuth flow, token storage, Drive API reading — implement later

---

## CS3 — Bulk Select

**Description:** Select multiple items to move or delete in one action.

**UI to build now:**
- Long press on mobile / checkbox toggle on desktop activates select mode
- Checkboxes appear on all cards
- Bottom action bar: "Move to folder" / "Delete" with count
- Coming Soon tooltip on the actions

---

## CS4 — Export Vault

**Description:** Download all items as JSON or CSV.

**UI to build now:**
- Export section in Settings
- Two disabled buttons: "Export as JSON" and "Export as CSV"
- Coming Soon badge

---

## CS5 — Share Item

**Description:** Share a public link to a single item.

**UI to build now:**
- "Share" option in item three-dot menu (disabled, Coming Soon tooltip)

---

## CS6 — Tags

**Description:** Tag items with custom labels for cross-folder organization.

**UI to build now:**
- Tag chip area in item detail view
- "Add tag" input (disabled, Coming Soon label)

---

## Non-goals for v1 (skip entirely)

- Push notifications
- Sharing items with other users (real-time collaboration)
- Browser extension
- Mobile native share sheet
- Video transcript fetching
- Device selector in settings
