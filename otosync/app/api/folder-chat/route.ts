import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/types'

function buildItemContext(items: Item[]): string {
  if (items.length === 0) return 'No items in this folder yet.'
  return items.map((item, i) => {
    let line = `[${i + 1}] ${item.type.replace('_', ' ').toUpperCase()}`
    if (item.content) line += `: "${item.content.slice(0, 400)}"`
    if (item.file_name) line += `: ${item.file_name}`
    if (item.link_title && item.link_url) line += `: ${item.link_title} — ${item.link_url}`
    else if (item.link_url) line += `: ${item.link_url}`
    if (item.drive_file_title) line += `: ${item.drive_file_title}`
    if (item.ai_description) line += ` (summary: ${item.ai_description})`
    return line
  }).join('\n')
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({
      message: 'AI chat requires OPENAI_API_KEY to be configured.',
      coming_soon: true,
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, items, folderName }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    items: Item[]
    folderName: string
  } = await req.json()

  const openai = new OpenAI({ apiKey })
  const itemContext = buildItemContext(items)

  const systemPrompt = `You are a personal AI assistant for a knowledge folder called "${folderName}". The user has ${items.length} saved item(s) here.

Saved content:
${itemContext}

Your role:
- Answer questions using the saved content above
- Summarize, organize, or find patterns in the content
- Help draft emails, notes, or documents using this material
- Be concise and direct — the user is busy

If referencing a specific item, cite it as [1], [2], etc. If the question can't be answered from the content, say so briefly.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    })
    return NextResponse.json({ message: completion.choices[0].message.content ?? '' })
  } catch (err: unknown) {
    const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0
    if (status === 401) return NextResponse.json({ error: 'OpenAI API key is invalid.' }, { status: 502 })
    return NextResponse.json({ error: 'Chat request failed. Please try again.' }, { status: 502 })
  }
}
