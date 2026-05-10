import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/authentication',
    '/authentication/coming-soon',
    '/authentication/create-password',
    '/authentication/create-password/create-basic',
    '/authentication/create-password/create-cover',
    '/authentication/error',
    '/authentication/error/401-error',
    '/authentication/error/404-error',
    '/authentication/error/500-error',
    '/authentication/lock-screen',
    '/authentication/lock-screen/lock-basic',
    '/authentication/lock-screen/lock-cover',
    '/authentication/reset-password',
    '/authentication/reset-password/reset-basic',
    '/authentication/reset-password/reset-cover',
    '/authentication/sign-in',
    '/authentication/sign-in/sign-in-basic',
    '/authentication/sign-in/sign-in-cover',
    '/authentication/sign-up',
    '/authentication/sign-up/sign-up-basic',
    '/authentication/sign-up/sign-up-cover',
    '/authentication/two-step-verification',
    '/authentication/two-step-verification/two-step-basic',
    '/authentication/two-step-verification/two-step-cover',
    '/authentication/under-maintenance',
    '/landing',
    '/coming-soon',
    '/under-maintenance'
  ]
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Skip middleware for public routes, static files, and Next.js internals
  if (isPublicRoute || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // If no user found, redirect to login
    if (error || !user) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If user is authenticated, allow access
    return response
    
  } catch (error) {
    console.error('❌ Middleware authentication error:', error)
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
