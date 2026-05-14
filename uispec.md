# UI_SPEC.md — Sync Interface Specification

## Design principles

- White background (#ffffff), clean and minimal
- Mobile-first. Every screen works at 390px wide.
- No sidebars on mobile — use bottom navigation
- Sidebar only appears on screens wider than 768px
- "Coming soon" features are always visible in the UI — never hidden. Show them with a badge or disabled state and a short explanation.

---

## Color tokens

```css
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--bg-card: #f4f4f4;
--bg-hover: #e9ecef;
--border: #e5e7eb;
--text-primary: #111111;
--text-secondary: #333333;
--text-muted: #888888;
--accent: #0891b2;
--accent-hover: #0e7490;
--success: #22c55e;
--error: #d32f2f;
--warning: #ffc107;
--coming-soon-bg: #f0f9ff;
--coming-soon-border: #bae6fd;
--coming-soon-text: #0369a1;
```

---

## Screen 1 — Landing / Login

**Route:** `/`

Layout: centered vertically and horizontally. Full viewport height.

Elements:
- App name "Sync" in large text, top center
- One-line tagline: "Your clipboard, organized across every device."
- "Continue with Google" button — full width, max 320px, white background, Google logo + text, black border
- Small text below: "Works on iPhone, iPad, and desktop via browser. No app install needed."

---

## Screen 2 — Vault Feed

**Route:** `/vault`

**Desktop layout:**
```
┌─────────────────────────────────────────────────────┐
│  Sync          [Search bar]          [+ Capture] │
├──────────────┬──────────────────────────────────────┤
│              │  [Filter: All|Text|Image|File|Link]  │
│  All Items   │                                      │
│  ─────────   │   [Item Card]                        │
│  Starred ★   │   [Item Card]                        │
│  ─────────   │   [Item Card]                        │
│  Folders     │   ...                                │
│    Job Apps  │                                      │
│    Clients   │                                      │
│    College   │                                      │
│              │                                      │
│  + New Folder│                                      │
│  ─────────   │                                      │
│  Settings    │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Mobile layout:**
```
┌─────────────────────┐
│ Sync        [+]  │
│ [Search bar]        │
├─────────────────────┤
│ [All] [Text] [Image]│  ← type filter chips
├─────────────────────┤
│                     │
│  [Item Card]        │
│  [Item Card]        │
│  [Item Card]        │
│  ...                │
│                     │
├─────────────────────┤
│ 🏠 Feed  📁 Folders  ⚙️ Settings │
└─────────────────────┘
```

---

## Component: Item Card

```
┌─────────────────────────────────────────────┐
│ [Type Icon]  [Content preview — 2 lines]    │
│              [AI description — 1 line, gray]│
│              (skeleton pulse if loading)    │
│                                             │
│ [Folder badge]  [Device]  [Time ago]  [★][⋮]│
└─────────────────────────────────────────────┘
```

Type icons (lucide-react):
- text → `FileText`
- image → `Image`
- file → `File`
- link → `Link`
- drive_link → `HardDrive` (colored teal)
- video_link → `Play`

Content preview:
- text: first 120 characters
- image: thumbnail (80×80)
- file: filename + size
- link/drive: title + domain
- video: thumbnail + title

Star button (★): toggles `is_starred` on the item. Starred items appear in "Starred" section in sidebar.

Three-dot menu (⋮):
- Move to folder
- Copy content (text items)
- Download (file/image items)
- Open in Drive (drive_link items)
- Delete (red, requires confirmation)

"Time ago": "2 min ago", "3 hours ago", "yesterday"

---

## Screen 3 — Folder View

**Route:** `/folder/:id`

Same layout as Vault Feed but filtered to folder items only.

Additional element: **tab bar** above the feed.

```
┌──────────────────────────────────────┐
│ ← Job Applications          [+ Add]  │
│ [Items]  [Ask AI ✨]                 │
├──────────────────────────────────────┤
│  (feed or chat depending on tab)     │
└──────────────────────────────────────┘
```

---

## Component: Folder AI Chat

**Status: Coming Soon**

Shown when "Ask AI" tab is active. The UI is fully built but the backend is not wired up yet.

```
┌──────────────────────────────────────────┐
│ ✨ AI Chat  [COMING SOON]                │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Context: X items in this folder      │ │
│ │ Drive docs: Connect Drive (coming    │ │
│ │ soon) to include your Google Docs    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│  🤖 AI chat is coming soon. When         │
│     live, you'll be able to ask          │
│     questions about everything in        │
│     this folder.                         │
│                                          │
├──────────────────────────────────────────┤
│ [Type a message...]        [Send]        │
│ (input disabled until feature launches) │
└──────────────────────────────────────────┘
```

The "COMING SOON" badge uses `--coming-soon-bg` and `--coming-soon-text` colors.

---

## Component: Capture Modal

Opens as a bottom sheet on mobile, centered modal on desktop.

Tabs: **Text | Image | File | Link | Drive Link**

Each tab has a simple form. "Save" button at bottom.

While saving: show spinner, disable button. After save: close modal, item appears in feed within 1 second.

Drive Link tab note: "Saved as a link — live content reading coming soon."

---

## Screen 4 — Item Detail (slide-in panel / modal)

Opens as a right-side panel on desktop, full-screen on mobile.

Full content display. Actions at bottom:
- Copy (for text)
- Download (for files/images)
- Move to folder
- Star / Unstar
- Open in Drive (for drive links) — opens link in new tab
- Read live content (for drive links) — **Coming Soon** badge
- Delete (red, confirmation required)

---

## Screen 5 — Settings

**Route:** `/settings`

Sections:

### 1. Account
- Profile photo, name, email
- Sign out button

### 2. Google Drive
```
┌────────────────────────────────────────┐
│ Google Drive          [COMING SOON]    │
│                                        │
│ Connect your Drive to let AI read      │
│ your Google Docs inside folders.       │
│                                        │
│ [Connect Google Drive] (disabled)      │
└────────────────────────────────────────┘
```

### 3. Export
```
┌────────────────────────────────────────┐
│ Export Vault          [COMING SOON]    │
│                                        │
│ Download all your items as JSON or CSV.│
└────────────────────────────────────────┘
```

### 4. Danger Zone
- "Delete all my data" — deletes all items, folders, and files. Requires typing "DELETE" to confirm.

---

## Additional frontend-only features (UI present, backend coming soon)

These appear in the UI. Build the UI shells now; wire up backend later as feasible.

| Feature | Where | Status |
|---|---|---|
| Star / Pin items | Feed card ★ button | Live — just a DB boolean update |
| Starred view | Sidebar "Starred ★" | Live — filtered feed of `is_starred` items |
| Bulk select | Feed (long press) | Coming soon — show checkbox mode UI |
| Share item | Three-dot menu | Coming soon — show disabled option |
| Tags | Item detail | Coming soon — show tag chip UI, disabled |
| Read mode | Text item detail | Coming soon — show button, disabled |
| Export vault | Settings | Coming soon — show section, buttons disabled |

---

## Responsive breakpoints

- Mobile: < 768px → bottom nav, no sidebar, full-width cards
- Tablet: 768px–1024px → sidebar icons only (no text labels), single column
- Desktop: > 1024px → full sidebar with text labels, single column with more detail

---

## Loading states

- Feed initial load: 3 skeleton cards pulsing
- Item card AI description: single-line skeleton until `ai_description` is populated via Realtime
- File/image upload: progress bar inside capture modal
- Search: instant (debounced 300ms), no separate loading state needed

---

## Empty states

- Empty feed: "Save your first item — tap + to get started"
- Empty folder: "No items in this folder yet — tap + to add"
- No search results: "No results for '[query]' — try different keywords"
- No folders: inline prompt in sidebar "Create your first folder"
