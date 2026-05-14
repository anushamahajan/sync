# Sync

A personal cross-device clipboard vault with AI-powered organization. Capture anything — text, images, files, Drive links, videos — from any device. Everything lands in one unified feed, auto-described by AI, and synced in real time across all your open sessions.

> Not a file manager. Not a notes app. A context-aware capture and retrieval layer for your daily work.

---

## What it does

- **Capture anything** — text, images, files, links, Google Drive links, YouTube videos
- **AI auto-categorization** — every item is automatically described and assigned a suggested folder (OpenAI, runs async in the background)
- **Real-time sync** — new items appear on all open devices within seconds via Supabase Realtime
- **Folders as workspaces** — organize items into color-coded folders; folder AI chat coming soon
- **Chrome extension** — capture directly from any browser tab with `Ctrl+Shift+S`, without leaving the page
- **PWA** — installable on iOS (Safari → Add to Home Screen) and Android (Chrome → Add to Home Screen). No App Store needed.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Supabase (Google OAuth) |
| Database | Supabase Postgres + Realtime |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o (server-side only) |
| Deployment | Vercel |
| Extension | Chrome Manifest V3 |

---

## Project structure

```
sync/
├── otosync/              # Next.js app
│   ├── app/
│   │   ├── vault/        # main feed
│   │   ├── folder/[id]/  # folder view + AI chat (coming soon)
│   │   ├── settings/
│   │   └── api/
│   │       ├── categorize/   # OpenAI categorization (POST)
│   │       ├── token/        # session token for Chrome extension
│   │       └── folder-chat/  # folder AI chat (coming soon)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── chrome-extension/     # Chrome Manifest V3 extension
```

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/anushamahajan/sync.git
cd sync/otosync
npm install
```

### 2. Environment variables

Create `otosync/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

`OPENAI_API_KEY` is server-only — never exposed to the browser.

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Google** auth provider: Authentication → Providers → Google
3. Run the SQL schema (see `architecture.md`)
4. Enable Realtime on the `items` table:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE items;
   ```
5. Create a Storage bucket named `vault` (private access)

### 4. Run

```bash
npm run dev
```

---

## Chrome extension

The extension lets you capture text, links, images, files, and Drive links directly from any browser tab without switching windows.

**Load the extension:**

1. Open Chrome → `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** → select the `chrome-extension/` folder
3. Open the app at `localhost:3000` and log in
4. Click the Sync icon → **Connect** to link your session

**Keyboard shortcut:** `Ctrl+Shift+S` (Mac: `⌃⇧S`)

**Captures supported from the extension:**
- Text (auto-fills selected text from the current page)
- Link (auto-fills current tab URL + title)
- Image (file picker with preview)
- File (any file type, up to 50 MB)
- Google Drive link (auto-fills if current tab is a Drive doc)

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com/new)
3. Set **Root Directory** to `otosync`
4. Add all four environment variables
5. Deploy

---

## Coming soon

- **Folder AI chat** — ask questions across everything inside a folder, including live Google Docs
- **Google Drive integration** — connect Drive to let the AI read linked documents in real time
- **Bulk select** — move or delete multiple items at once
- **Export** — download your vault as JSON or CSV

---

## License

Private — personal project.

---

## Why I built this

Built this because I was genuinely tired of pasting things into Telegram Saved Messages like some kind of feral person. You have a phone, a tablet, a laptop, and somehow moving one paragraph between them is a 4-step process. That bothered me enough to actually do something about it.

Sync is a persistent clipboard that doesn't forget. Save text, images, files, Drive links, whatever — it shows up on all your devices in real time. AI reads what you saved and files it for you. The whole thing runs in Safari and Chrome. No app store, no Xcode, no drama.

**What I cut:** push notifications, video transcripts, bulk select, and a proper device selector. None of that was core. The core was capture, sync, folders, and AI categorization. That's what got built.

**What I shipped beyond the original scope:** a Chrome extension. Press `Ctrl+Shift+S` on any tab and capture directly — text, links, images, files, Drive links — without leaving the page. That ended up being more useful than expected.

**With another 10 hours I'd do three things:**

1. Build the folder AI chat so it actually streams instead of waiting for the full response. The UI is there, the endpoint is stubbed — it just needs the backend wired up. The latency on a full response kills the experience.
2. Connect the Drive integration properly so the folder chat can read your actual Google Docs live, no downloading needed. The architecture is designed for it; it just needs the OAuth flow and Drive API calls.
3. Add a weekly digest — a simple summary of what you saved, with a nudge to file the unorganized stuff. That's the feature that would make people actually keep using it.

Honest take: the Drive integration is going to be the best part, and most people won't realize how useful it is until they try it once.
