import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { log } from '@/lib/log'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/vault'

  log('auth/callback', 'info', 'received', { hasCode: !!code, next, origin })

  if (code) {
    const cookieStore = await cookies()
    const cookieNames = cookieStore.getAll().map(c => c.name)
    log('auth/callback', 'info', 'cookies present', { cookieNames })

    const response = NextResponse.redirect(`${origin}${next}`, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            log('auth/callback', 'info', 'setting session cookies', {
              cookies: cookiesToSet.map(c => c.name),
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      log('auth/callback', 'error', 'exchangeCodeForSession failed', {
        error: error.message,
        status: error.status,
      })
      return NextResponse.redirect(`${origin}/?error=auth`)
    }

    log('auth/callback', 'info', 'session established', {
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
      expiresAt: data.session?.expires_at,
    })

    return response
  }

  log('auth/callback', 'warn', 'no code param — redirecting to error', { origin })
  return NextResponse.redirect(`${origin}/?error=auth`)
}
