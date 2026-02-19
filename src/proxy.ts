import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    // Handle CORS
    const response = NextResponse.next();

    // Set CORS headers for all responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: response.headers,
        });
    }

    const token = request.cookies.get('token')?.value
    // console.log('Proxy executing. Path:', request.nextUrl.pathname);

    const { pathname } = request.nextUrl

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/embed']

    // Check if current path is public or an API route
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/api/');

    // Redirect unauthenticated users to login for dashboard pages
    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users away from login/register
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
