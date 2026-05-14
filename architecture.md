# ARCHITECTURE.md — Sync System Design

## High-level architecture

```
[Device: Phone / iPad / Laptop]
        |
   Next.js App (PWA)
   Frontend: app/ pages + components
   Backend:  app/api/ route handlers
        |
   Supabase Auth (Google OAuth)
        |
   Supabase Realtime ←→ Supabase DB (Postgres)
        |                      |
   Supabase Storage      OpenAI API (server-side only)
   (images, files)       - async item categorization
                         - folder AI chat [coming soon]
                               |
                        Google Drive API [coming soon]
                        (read linked docs live)
```

---

## Database schema

### Table: `items`
Every captured piece of content.

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'file', 'link', 'drive_link', 'video_link')),
  content TEXT,                        -- raw text or paragraph content
  file_url TEXT,                       -- Supabase Storage URL for images/files
  file_name TEXT,
  file_size_bytes INTEGER,
  drive_file_id TEXT,                  -- Google Drive file ID if type = drive_link
  drive_file_title TEXT,
  link_url TEXT,                       -- for generic links and video links
  link_title TEXT,
  ai_description TEXT,                 -- one-line AI-generated description (filled async)
  ai_suggested_folder TEXT,            -- folder name AI recommends (filled async)
  folder_id UUID REFERENCES folders(id),
  source_device TEXT,                  -- 'mobile', 'tablet', 'desktop'
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `folders`
User-created workspaces.

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0891b2',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `drive_tokens`
Stores Google Drive OAuth tokens per user. Used when Drive integration is enabled.

```sql
CREATE TABLE drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Supabase Realtime setup

Enable realtime on the `items` table. Subscribe to INSERT and UPDATE events filtered by `user_id`.

```typescript
const channel = supabase
  .channel('vault-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'items',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // prepend payload.new to local feed state
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'items',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // merge updated fields into existing item in state
    // this is how AI description arrives without a page refresh
  })
  .subscribe()
```

---

## File storage structure

Supabase Storage bucket: `vault`

```
vault/
  {user_id}/
    images/
      {item_id}.jpg
    files/
      {item_id}_{original_filename}
```

Max file size: 25MB per item. Enforce on frontend before upload.

---

## API routes (Next.js App Router)

All routes live in `app/api/`. All routes verify Supabase JWT before executing.

| Route | Method | Purpose | Status |
|---|---|---|---|
| `app/api/categorize/route.ts` | POST | Calls OpenAI with item content, returns description + folder suggestion | Live |
| `app/api/folder-chat/route.ts` | POST | Assembles folder context, streams OpenAI response | Coming soon |
| `app/api/drive-read/route.ts` | POST | Fetches Google Doc content via Drive API | Coming soon |
| `app/auth/callback/route.ts` | GET | Exchanges OAuth code for session, redirects to /vault | Live |

### Categorize route (async, non-blocking)

```typescript
// app/api/categorize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  // 1. Verify auth via Supabase server client
  // 2. Parse { itemId, item, folderNames } from body
  // 3. Call OpenAI (see AI_SPEC.md for prompt)
  // 4. Update item row in DB with ai_description + ai_suggested_folder
  // 5. Return 200 — Realtime UPDATE will push the change to the client
}
```

### Categorization is fire-and-forget on the client

```typescript
// lib/categorize.ts
export function triggerCategorization(itemId: string, item: Item, folderNames: string[]) {
  // No await — intentionally fire and forget
  fetch('/api/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, item, folderNames })
  }).catch(() => {}) // fail silently
}
```

The save → show flow completes in under 1 second. The AI enrichment arrives via Realtime UPDATE 3–5 seconds later.

---

## Google Drive integration flow (coming soon)

1. User clicks "Connect Google Drive" in settings
2. App redirects to Google OAuth with scopes: `drive.readonly`
3. Callback stores access + refresh tokens in `drive_tokens` table
4. When user adds a Drive link to vault: app extracts file ID from URL, stores in `drive_file_id`
5. When folder AI chat runs: for every Drive link in the folder, call `/api/drive-read` to fetch latest content
6. Content is injected into OpenAI context

Token refresh: check `expires_at` before every Drive API call. If expired, use refresh token to get new access token and update the row.

---

## Security rules (Supabase RLS)

```sql
-- Users can only see their own items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_items" ON items
  USING (auth.uid() = user_id);

-- Users can only see their own folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_folders" ON folders
  USING (auth.uid() = user_id);

-- Drive tokens are private
ALTER TABLE drive_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_drive_tokens" ON drive_tokens
  USING (auth.uid() = user_id);
```

---

## PWA configuration

In `public/manifest.json`:

```json
{
  "name": "Sync",
  "short_name": "Sync",
  "start_url": "/vault",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0891b2",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Register a service worker for offline shell caching. Cache the app shell (HTML, CSS, JS bundles). Do not cache vault data — always fetch fresh from Supabase.
