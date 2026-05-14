import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

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
  log('api/token', 'info', 'request received')

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    log('api/token', 'error', 'getSession failed', { error: error.message })
    return NextResponse.json({ error: 'Session error' }, { status: 500, headers: CORS })
  }

  if (!session) {
    log('api/token', 'warn', 'no session — unauthenticated')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: CORS })
  }

  log('api/token', 'info', 'token issued', { userId: session.user.id, email: session.user.email })
  return NextResponse.json(
    { access_token: session.access_token, user_id: session.user.id },
    { headers: CORS }
  )
}
