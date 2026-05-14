# TECH_STACK.md — Sync Technology Choices

## Frontend + Backend

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14+ (App Router) | Full-stack framework — frontend pages + API routes |
| TypeScript | 5+ | Type safety across frontend and backend |
| TailwindCSS | 3+ | Styling |
| @supabase/supabase-js | 2+ | DB, Storage, Realtime (client-side) |
| @supabase/ssr | latest | Supabase auth with Next.js SSR / middleware |
| lucide-react | latest | Icons |
| openai | latest | OpenAI SDK for server-side API calls |

---

## Infrastructure

| Tool | Purpose |
|---|---|
| Supabase | Auth (Google OAuth), Postgres DB, Storage, Realtime |
| OpenAI API | Item categorization (async), folder AI chat (coming soon) |
| Google Drive API v3 | Live document reading — **coming soon** |
| Vercel | Deployment (recommended) |

---

## Setup commands

```bash
# 1. Create Next.js project
npx create-next-app@latest Sync --typescript --tailwind --app --no-src-dir
cd Sync

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr lucide-react openai

# 3. Tailwind is pre-configured by create-next-app
# Confirm tailwind.config.ts content array includes:
content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"]
```

---

## Environment variables

Create `.env.local` at project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**Important:** `OPENAI_API_KEY` has no `NEXT_PUBLIC_` prefix — it is server-only and never exposed to the browser. All OpenAI calls happen inside `app/api/` route handlers.

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is used only for Supabase's Google OAuth. The Drive OAuth (coming soon) will add `GOOGLE_CLIENT_SECRET` and a callback route.

---

## Supabase project setup

1. Go to supabase.com → New Project
2. Enable Google Auth provider: Authentication → Providers → Google → enter Client ID and Secret
3. Authorized redirect URI for Supabase: `https://<your-project>.supabase.co/auth/v1/callback`
4. Run the SQL from ARCHITECTURE.md to create tables
5. Enable Realtime on `items` table: Database → Replication → enable `items`
6. Create Storage bucket named `vault` with private access
7. Add RLS policies from ARCHITECTURE.md

---

## Google OAuth setup

1. Go to console.cloud.google.com → New Project → "Sync"
2. Enable APIs: Google Drive API (for future use)
3. OAuth consent screen: External, add your email as test user
4. Credentials → Create OAuth Client ID → Web application
5. Authorized redirect URIs:
   - `http://localhost:3000` (dev)
   - `https://<your-project>.supabase.co/auth/v1/callback`
   - Your production domain

---

## File structure

```
Sync/
├── public/
│   ├── manifest.json
│   ├── sw.js                         (service worker)
│   ├── icon-192.png
│   └── icon-512.png
├── app/
│   ├── layout.tsx                    (root layout, service worker registration)
│   ├── page.tsx                      (landing / login)
│   ├── globals.css
│   ├── vault/
│   │   └── page.tsx                  (main feed)
│   ├── folder/
│   │   └── [id]/
│   │       └── page.tsx              (folder view + Ask AI tab)
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── categorize/
│       │   └── route.ts              (POST — OpenAI categorization, server-side)
│       └── folder-chat/
│           └── route.ts              (POST — coming soon placeholder)
├── components/
│   ├── Layout.tsx                    (sidebar + main area wrapper)
│   ├── Sidebar.tsx                   (desktop sidebar)
│   ├── BottomNav.tsx                 (mobile bottom navigation)
│   ├── FeedCard.tsx
│   ├── CaptureModal.tsx
│   ├── FolderChat.tsx                (coming soon UI)
│   ├── SearchBar.tsx
│   ├── ItemDetailModal.tsx
│   ├── NewFolderModal.tsx
│   ├── MoveFolderModal.tsx
│   └── Toast.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useVault.ts                   (fetch + realtime items)
│   └── useFolders.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 (browser Supabase client)
│   │   └── server.ts                 (server Supabase client for API routes)
│   ├── categorize.ts                 (fire-and-forget categorization call)
│   └── utils.ts                      (shared helpers)
├── types/
│   └── index.ts                      (shared TypeScript types)
├── middleware.ts                      (Supabase session refresh)
├── .env.local
└── next.config.ts
```
