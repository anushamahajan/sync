import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { log } from '@/lib/log'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    log('middleware', 'error', 'getSession failed', { pathname, error: error.message })
  }

  const protectedRoutes = ['/vault', '/folder', '/settings', '/starred', '/folders']
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))

  log('middleware', 'info', 'request', {
    pathname,
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    isProtected,
  })

  if (!session && isProtected) {
    log('middleware', 'warn', 'unauthenticated — redirecting to /', { pathname })
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (session && pathname === '/') {
    log('middleware', 'info', 'authenticated on / — redirecting to /vault', { userId: session.user.id })
    const url = request.nextUrl.clone()
    url.pathname = '/vault'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
