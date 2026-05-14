# BUILD_ORDER.md — How to Build Sync

Follow this exactly. Do not skip ahead. Each step builds on the previous. Build in one continuous session.

---

## Phase 1: Project setup and auth

**Goal:** Running Next.js app with Google login working.

```bash
npx create-next-app@latest Sync --typescript --tailwind --app --no-src-dir
cd Sync
npm install @supabase/supabase-js @supabase/ssr lucide-react openai
```

1. Configure Tailwind (see TECH_STACK.md)
2. Create `.env.local` with Supabase + OpenAI keys
3. Create `lib/supabase/client.ts` — browser Supabase client
4. Create `lib/supabase/server.ts` — server Supabase client (for API routes)
5. Create `middleware.ts` — Supabase auth session refresh on every request
6. Create `app/page.tsx` — Landing page with Google sign in button:

```typescript
async function signIn() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/auth/callback' }
  })
}
```

7. Create `app/auth/callback/route.ts` — exchange code for session, redirect to `/vault`
8. Create `hooks/useAuth.ts` — listen to auth state changes
9. Run `npm run dev` — confirm login works and redirects to `/vault`

**Checkpoint:** You can log in with Google and see a blank `/vault` page.

---

## Phase 2: Vault feed + real-time sync

**Goal:** Items appear in feed. New items from any device/session appear instantly.

1. Run SQL from ARCHITECTURE.md to create tables in Supabase
2. Create `hooks/useVault.ts`:
   - Fetch items ordered by `created_at DESC` limit 20
   - Subscribe to Supabase Realtime INSERT + UPDATE on `items`
   - Prepend new items to state, merge updates in place
3. Create `components/FeedCard.tsx` — renders one item based on type
4. Create `app/vault/page.tsx` — renders feed using useVault
5. Create `components/CaptureModal.tsx`:
   - Tabs: Text, Image, File, Link, Drive Link
   - Text tab first — textarea + save button
   - On save: insert row into `items` table, close modal
6. Add floating "+" button to Vault page that opens CaptureModal
7. Test: save a text item on one browser tab, confirm it appears on another tab open simultaneously

**Checkpoint:** Real-time feed works. Text capture works. Cross-device sync confirmed.

---

## Phase 3: All capture types

**Goal:** All 5 content types can be saved.

1. **Image tab:** file picker → validate ≤25MB → upload to Supabase Storage → store URL in item
2. **File tab:** file picker → validate ≤25MB → upload to Supabase Storage → store filename + URL
3. **Link tab:** URL + title fields → auto-detect if Drive URL → switch to Drive tab
4. **Drive Link tab:** URL field → call `extractDriveFileId()` → store file ID
   - Drive reading is **coming soon** — just store the URL and file ID for now
   - Show "Drive link saved — reading coming soon" note in UI

Update FeedCard to render correctly for each type (thumbnail for images, icon + filename for files, etc.)

**Checkpoint:** All 5 capture types save successfully. Feed shows correct previews per type.

---

## Phase 4: Folders

**Goal:** User can create folders and move items into them.

1. Create `hooks/useFolders.ts` — fetch all user folders, subscribe to realtime changes
2. Create folder list in sidebar (desktop) and folders tab (mobile)
3. "New Folder" button → modal with name + color picker (6 preset colors)
4. Insert into `folders` table on save
5. Create `app/folder/[id]/page.tsx` — same as Vault but filtered by `folder_id`
6. Add "Move to folder" to item context menu (three-dot menu on FeedCard)
7. Update item's `folder_id` in DB on move
8. Show folder badge on FeedCard when item has a folder

**Checkpoint:** Folders exist. Items can be moved. Folder view shows filtered feed.

---

## Phase 5: Search

**Goal:** Search works across all item fields.

1. Add search bar to top of Vault page
2. On input (debounced 300ms): query Supabase with `ilike` across `content`, `ai_description`, `file_name`, `link_title`, `drive_file_title`
3. Add type filter buttons: All | Text | Image | File | Link | Drive | Video
4. Add folder filter dropdown
5. Show result count and "No results" empty state

**Checkpoint:** Search filters feed correctly by keyword and type.

---

## Phase 6: AI categorization (async, non-blocking)

**Goal:** Every saved item gets auto-described and folder-suggested. This must never block item saving or feed display.

1. Create `app/api/categorize/route.ts` — Next.js API route that calls OpenAI (server-side, key never exposed to browser):
   - Accepts `{ item, folderNames }` in POST body
   - Calls OpenAI with prompt from AI_SPEC.md
   - Returns `{ description, suggested_folder }`
2. Create `lib/categorize.ts` — client helper that fires the API call:
   - Called **after** item is already inserted and shown in feed
   - Uses `fetch()` with no `await` at call site — fire and forget
   - On response: update item row with `ai_description` and `ai_suggested_folder`
3. FeedCard updates automatically via Realtime UPDATE subscription (already set up in Phase 2)
4. If suggested folder matches an existing folder name (case-insensitive), show "Move to [folder]?" toast
5. On any error: fail silently — item was already saved, this is optional enrichment

**Important:** The save → show-in-feed flow must complete in under 1 second. Categorization result arrives 3–5 seconds later and updates the card in place.

**Checkpoint:** Items appear instantly. AI description and folder suggestion appear within 5 seconds.

---

## Phase 7: Folder AI Chat (UI placeholder — coming soon)

**Goal:** Build the full UI for folder AI chat. Backend integration is coming soon.

1. Add "Ask AI" tab to folder page
2. Create `components/FolderChat.tsx`:
   - Show "Coming Soon" banner explaining what this will do
   - Render the full chat UI (input box, message list, context summary bar) in a disabled/preview state
   - Context summary shows: "X items in this folder"
   - "Connect Drive to unlock Drive context" prompt (disabled, coming soon)
3. Do not wire up any API calls yet — show a placeholder response: "AI chat is coming soon. Your folder context is being prepared."

**Checkpoint:** Ask AI tab is visible and renders the chat UI. No backend call needed.

---

## Phase 8: Google Drive (UI placeholder — coming soon)

**Goal:** All Drive-related UI exists and is clearly marked coming soon. No OAuth flow yet.

1. In Settings page: "Connect Google Drive" section with "Coming Soon" badge
2. In CaptureModal Drive Link tab: show "Saved as link — live reading coming soon"
3. In FeedCard for drive_link items: show Drive icon + "Open in Drive" button (opens URL), "Live reading: coming soon" tooltip
4. In FolderChat context bar: "Drive docs: Connect Drive (coming soon)"

**Checkpoint:** All Drive UI is present and clearly labeled. No OAuth wiring needed.

---

## Phase 9: Settings page

**Goal:** Settings page is complete.

1. Create `app/settings/page.tsx` with sections:
   - **Account** — profile photo, name, email, Sign Out button
   - **Google Drive** — "Connect Google Drive" (Coming Soon badge)
   - **Notifications** — coming soon placeholder
   - **Danger Zone** — "Delete all my data" (with confirmation dialog)
2. Sign out clears session and redirects to landing

**Checkpoint:** Settings page renders. Sign out works.

---

## Phase 10: PWA + polish

**Goal:** App installs on iPhone via Safari. All edge cases handled.

1. Create `public/manifest.json` (see ARCHITECTURE.md)
2. Create `public/sw.js` — cache app shell only, never cache vault data
3. Register service worker in `app/layout.tsx`
4. Add `<meta name="apple-mobile-web-app-capable" content="yes">` to layout
5. Create or download 192×192 and 512×512 app icons

**Polish checklist:**
- [ ] Empty states for feed, folders, search
- [ ] Loading skeletons while fetching
- [ ] Error states for failed uploads
- [ ] File size limit error (>25MB) shown clearly
- [ ] Responsive layout works at 390px, 768px, 1280px
- [ ] Sign out works
- [ ] Item deletion with confirmation dialog
- [ ] All "coming soon" features have proper UI placeholders with explanatory text

**Final test:**
- Open app on phone, tablet, laptop simultaneously
- Save text from phone → confirm it appears on laptop within 3 seconds
- Save Drive link → confirm it appears as link card with "coming soon" reading note

---

## What to build later (post-v1)

These are deprioritized, not deleted:
1. Google Drive OAuth + live doc reading (backend for Phase 8)
2. Folder AI chat backend (backend for Phase 7)
3. Video link transcript fetching
4. Device selector in settings
5. Folder color picker (use one default color for now)

The non-negotiables for v1: capture, feed, real-time sync, folders, async AI categorization, PWA install.
