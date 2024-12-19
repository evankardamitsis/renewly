import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = new URL(request.url)

  // Define auth-related paths
  const isAuthPage = url.pathname === '/login' || 
                    url.pathname === '/register' || 
                    url.pathname === '/verify-email'
  const isAuthRoute = url.pathname.startsWith('/auth/')

  // Always allow auth routes to process
  if (isAuthRoute) {
    return response
  }

  // If user is signed in and tries to access auth pages, redirect them
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is not signed in and tries to access protected pages
  if (!user && !isAuthPage) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}