import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Define protected and auth routes
    const protectedRoutes = ['/portfolio', '/companies', '/reports', '/analytics', '/upload', '/settings', '/team', '/security']
    const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !user) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/portfolio', request.url))
    }

    // Redirect root to appropriate page
    if (request.nextUrl.pathname === '/') {
        if (user) {
            return NextResponse.redirect(new URL('/portfolio', request.url))
        } else {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    return response
}