import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const isAuthPage =
        request.nextUrl.pathname.startsWith('/signin') ||
        request.nextUrl.pathname.startsWith('/signup');
    const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/dashboard');

    if (isProtectedRoute && !token) {
        const url = request.nextUrl.clone();
        url.pathname = '/signin';
        // Add redirect parameter to return after login
        url.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthPage && token) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/signin', '/signup'],
};
