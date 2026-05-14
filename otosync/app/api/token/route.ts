import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': 'https://otosync.vercel.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: CORS })
  }

  return NextResponse.json(
    { access_token: session.access_token, user_id: session.user.id },
    { headers: CORS }
  )
}
