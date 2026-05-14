# Sync

I was pasting things into Telegram Saved Messages like a feral person. Phone, iPad, laptop, three devices, zero way to move a paragraph between them without it becoming a whole thing. Copy on laptop, open WhatsApp Web, send to yourself, open phone, copy again. For a paragraph. That's insane and I did it for years before deciding to just build the thing that should already exist.

Sync is a persistent clipboard that works across all your devices. Save anything from anywhere. It shows up everywhere else immediately. AI reads what you saved, describes it, and files it. You don't have to do any of that.

Access it here : https://otosync.vercel.app/

Here's the Demo Video: https://drive.google.com/file/d/15CLzaXt3TnuRD2IdUOsRsDAOcOglVQOg/view?usp=sharing

---

## The problem

Every tool makes you organize at the worst possible moment — the moment you're trying to save something.

- You save a job description in bookmarks. You never open bookmarks. It's gone.
- You write a paragraph on your phone. Your laptop has a different notes app. Finding it requires remembering what you called the note, and you called it "untitled 47".
- You get a Google Doc link in email. You email it to yourself with "remember this" in the subject line, which works exactly once.
- You screenshot something because that's the fastest way to save it. Now you have 2,000 screenshots.

You are the glue. You're the filing system. You're the one remembering where you put things.

Sync is built on one assumption: if saving is fast enough and finding is reliable enough, the filing can happen later or not at all.

---

## What's built

### Vault
Everything lands in a single feed — text, images, files, URLs, Drive links, YouTube videos. Each item gets an AI-generated description, tags, and a folder suggestion within a few seconds of saving. Filter by type, search by keyword across content and AI descriptions. The search runs against what the AI understood, not just the raw text you saved.

### Folders
Not just buckets. Each folder has a name, color, and description. The more useful part: every folder has a **Chat with AI** tab that has already read everything inside it. Ask "which of these are relevant for a fintech PM role?" and it answers using your actual content. No copy-pasting into ChatGPT.

### Chrome Extension
`Ctrl+Shift+S` from any tab opens a popup without leaving the page. Auto-fills intelligently — selected text goes into the text field, Drive URLs get detected and filled in automatically. Four seconds from trigger to saved.

### Real-time sync
Save on your phone, open your laptop, it's already there. Supabase Realtime pushes to every open session the moment it hits the database. No refresh, no polling.

<img width="1440" height="759" alt="image" src="https://github.com/user-attachments/assets/87a4980d-aabc-4b87-9919-51eac7da6ae5" />

<img width="2880" height="1432" alt="image" src="https://github.com/user-attachments/assets/9b1b9d21-930c-4061-9063-bc311cb05cdf" />

---

## What got cut

- **Video transcripts** — auto-transcribing YouTube links via Whisper. Real value, too much infrastructure for v1.
- **Push notifications** — direct notification popups which you can access via one click
- **Bulk select** — not needed until you have hundreds of items.

---

## What's next

**Streaming folder chat** — the chat waits for the full AI response before showing anything. on a folder with 20 items that's a 15 second blank screen. streaming shows words as they generate, same as ChatGPT. makes the feature feel alive instead of broken.

**Live Google Drive reading** — right now if you save a Drive link, Sync stores the title and URL. the folder AI knows you have a doc called "PM Resume v3" but cannot read what's inside it. connecting Drive OAuth and fetching content live means when you ask "write a cover letter using my resume," it actually reads the doc and does it. no downloading, no copy-pasting.

**iOS share sheet** — on desktop the Chrome extension means you never leave the page you're on. on mobile you have to open the Sync app and then capture. a share sheet extension closes that gap — reading a job description in Safari, tap share, tap Sync, it saves and closes. same four second experience as the extension but on mobile.

**Export** — a button that downloads your entire vault as JSON. every item, description, tag, folder, date. right now if Sync breaks or you stop using it, your data is stuck. export means you own what you saved.

---

## Stack

| | |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Auth + DB + Realtime | Supabase |
| File storage | Supabase Storage |
| AI categorization + chat | Claude API (claude-sonnet-4-20250514) |
| Extension | Chrome Extensions API (Manifest V3) |


