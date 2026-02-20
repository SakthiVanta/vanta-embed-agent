import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of paths that are accessible without authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/pricing',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/embed',
  '/api/stripe/webhook',
  '/api/agents'
]

// Static assets that should bypass proxy
const STATIC_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]

// Support both named and default exports for compatibility
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[Proxy] Processing: ${pathname}`)

  // Check if it's a static asset
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`[Proxy] Static path, skipping: ${pathname}`)
    return NextResponse.next()
  }

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  )

  // Get token from cookies or headers
  const cookieToken = request.cookies.get('token')?.value

  // Check for API key in headers (Bearer token or x-api-key)
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
  const xApiKey = request.headers.get('x-api-key')?.trim()

  const token = cookieToken || bearerToken || xApiKey
  const isAuthenticated = !!token

  console.log(`[Proxy] Path: ${pathname}, Public: ${isPublicPath}, Auth: ${isAuthenticated}, Has API Key: ${!!(bearerToken || xApiKey)}`)

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
  }

  // If user is authenticated and trying to access login/register, redirect to home
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    console.log(`[Proxy] Authenticated user accessing auth page, redirecting to /`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is NOT authenticated and trying to access protected page, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    console.log(`[Proxy] Unauthenticated user accessing protected page, redirecting to /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Continue to the requested page
  console.log(`[Proxy] Allowing access to: ${pathname}`)
  const response = NextResponse.next()

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// Default export for compatibility
export default proxy

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
