# AI_SPEC.md — OpenAI Integration

## Model

Always use: `gpt-4o`
Max tokens: 256 for categorization, 2048 for chat responses.

All OpenAI calls happen **server-side only** in Next.js API route handlers. The `OPENAI_API_KEY` is never exposed to the browser.

---

## Call 1 — Item Auto-Categorization

**When:** Triggered immediately after any item is saved to the DB — fire and forget, never blocks item save.
**Where:** `app/api/categorize/route.ts` (Next.js API route)
**Purpose:** Generate a one-line description and suggest a folder name.

### API route implementation

```typescript
// app/api/categorize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, item, folderNames } = await req.json()

  const contentSummary = buildContentSummary(item)

  const prompt = `
You are organizing a personal vault of captured content.

Analyze this item and return ONLY a JSON object with two fields:
- "description": a single sentence (max 12 words) describing what this is
- "suggested_folder": a short folder name (2-4 words) this belongs in

Existing folders the user has: ${folderNames.join(', ') || 'none yet'}

If the item clearly belongs in an existing folder, use that exact folder name.
If it belongs in a new folder, suggest a concise name.

Item type: ${item.type}
Item content: ${contentSummary}

Return only valid JSON. No explanation, no markdown, no backticks.
Example: {"description": "Resume for product manager roles", "suggested_folder": "Job Applications"}
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = completion.choices[0].message.content ?? ''
    const result = JSON.parse(text)

    await supabase
      .from('items')
      .update({
        ai_description: result.description,
        ai_suggested_folder: result.suggested_folder,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Categorization failed:', err)
    return NextResponse.json({ ok: false })
  }
}

function buildContentSummary(item: any): string {
  if (item.type === 'text') return item.content?.slice(0, 500) ?? ''
  if (item.type === 'image') return `Image file: ${item.file_name}`
  if (item.type === 'file') return `File: ${item.file_name}`
  if (item.type === 'link') return `Link: ${item.link_title ?? ''} ${item.link_url}`
  if (item.type === 'drive_link') return `Google Drive file: ${item.drive_file_title ?? item.drive_file_id}`
  if (item.type === 'video_link') return `Video: ${item.link_title ?? item.link_url}`
  return ''
}
```

### Client-side trigger (fire and forget)

```typescript
// lib/categorize.ts
export function triggerCategorization(itemId: string, item: Item, folderNames: string[]) {
  // Intentionally not awaited — item is already saved and showing in feed
  fetch('/api/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, item, folderNames })
  }).catch(() => {})
}
```

**Expected DB update after ~3–5 seconds:**
```json
{
  "ai_description": "Resume tailored for PM roles at fintech",
  "ai_suggested_folder": "Job Applications"
}
```

The Realtime UPDATE subscription (set up in useVault) will push this change to the feed card automatically.

**On error:** Fail silently. Item was already saved and displayed. No retry needed for v1.

---

## Call 2 — Folder AI Chat (Coming Soon)

**Status:** UI is built (see UI_SPEC.md). Backend implementation is coming soon.

**When:** User sends a message in the "Ask AI" tab inside a folder.
**Where:** `app/api/folder-chat/route.ts`
**Purpose:** Answer using all content in the folder as context.

### Placeholder route (returns coming soon message)

```typescript
// app/api/folder-chat/route.ts
export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: "Folder AI chat is coming soon. Your items are being prepared for AI context."
  })
}
```

### Full implementation (coming soon)

```typescript
async function assembleFolderContext(folderId: string, supabase: any) {
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('folder_id', folderId)

  const contextParts: string[] = []

  for (const item of items ?? []) {
    if (item.type === 'text') {
      contextParts.push(`[Saved Text]\n${item.content}`)
    } else if (item.type === 'link') {
      contextParts.push(`[Saved Link] ${item.link_title}: ${item.link_url}`)
    } else if (item.type === 'drive_link') {
      // fetch live content from Drive API — coming soon
      contextParts.push(`[Google Drive: ${item.drive_file_title ?? item.drive_file_id}] — live reading coming soon`)
    } else if (item.type === 'file') {
      contextParts.push(`[File: ${item.file_name}]`)
    } else if (item.type === 'video_link') {
      contextParts.push(`[Video: ${item.link_title}]: ${item.link_url}`)
    }
  }

  return contextParts.join('\n\n---\n\n')
}

async function folderChat(folderId: string, userMessage: string, chatHistory: any[], supabase: any) {
  const context = await assembleFolderContext(folderId, supabase)

  const systemPrompt = `
You are a personal AI assistant with access to a folder of saved content.
Use the content below as your knowledge base. Answer the user's question using this content.
If the content doesn't contain what's needed, say so clearly.
Be concise and specific. Do not make things up.

--- FOLDER CONTENTS ---
${context}
--- END OF FOLDER CONTENTS ---
`

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userMessage }
    ]
  })

  return completion.choices[0].message.content
}
```

**Chat history format:**
```typescript
[
  { role: 'user', content: 'Write a cover letter using my resume' },
  { role: 'assistant', content: 'Sure, here is a cover letter...' },
  { role: 'user', content: 'Make it shorter' }
]
```

Store chat history in React state only. Not persisted to DB. Resets when folder tab is closed.

---

## Token limits and context management

Each Google Doc fetched can be large. Truncate at 4000 characters per document with a note: "[truncated — showing first 4000 chars]".

If total context exceeds ~80,000 characters, truncate oldest/smallest items first and inform the user: "Some older items were excluded to fit context limits."

---

## Error handling for all AI calls

```typescript
try {
  const result = await categorizeItem(item, folders)
  // update item in DB
} catch (err) {
  console.error('Categorization failed:', err)
  // do not throw — item was already saved, this is optional enrichment
}
```

Never let an AI failure block item save. Categorization is enhancement only.
