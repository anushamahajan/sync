import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/types'

function buildContentSummary(item: Item): string {
  switch (item.type) {
    case 'text': return item.content?.slice(0, 500) ?? ''
    case 'image': return `Image file: ${item.file_name ?? 'unnamed'}`
    case 'file': return `File: ${item.file_name ?? 'unnamed'}`
    case 'link': return `Link: ${item.link_title ?? ''} ${item.link_url ?? ''}`
    case 'drive_link': return `Google Drive: ${item.drive_file_title ?? item.drive_file_id ?? ''}`
    case 'video_link': return `Video: ${item.link_title ?? item.link_url ?? ''}`
    default: return ''
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'OpenAI is not configured (set OPENAI_API_KEY).' },
      { status: 503 }
    )
  }

  const openai = new OpenAI({ apiKey })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, item, folderNames }: { itemId: string; item: Item; folderNames: string[] } = await req.json()

  const contentSummary = buildContentSummary(item)

  const prompt = `You are organizing a personal vault of captured content.

Analyze this item and return ONLY a JSON object with two fields:
- "description": a single sentence (max 12 words) describing what this is
- "suggested_folder": a short folder name (2-4 words) this belongs in

Existing folders: ${folderNames.join(', ') || 'none yet'}
If the item clearly belongs in an existing folder, use that exact folder name.

Item type: ${item.type}
Item content: ${contentSummary}

Return only valid JSON. No explanation, no markdown, no backticks.
Example: {"description": "Resume for product manager roles", "suggested_folder": "Job Applications"}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = completion.choices[0].message.content ?? ''
    const result = JSON.parse(text)

    await supabase
      .from('items')
      .update({
        ai_description: result.description,
        ai_suggested_folder: result.suggested_folder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true, description: result.description, suggested_folder: result.suggested_folder })
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number'
        ? (err as { status: number }).status
        : undefined
    if (status === 401) {
      console.error('Categorization failed: invalid or revoked OpenAI API key')
      return NextResponse.json(
        { ok: false, error: 'OpenAI API key is invalid or expired. Update OPENAI_API_KEY.' },
        { status: 502 }
      )
    }
    console.error('Categorization failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Categorization failed' }, { status: 502 })
  }
}
