
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal passthrough middleware required by Next.js
// Keep lightweight — this file is present so Next can run middleware hooks if needed.
export function middleware(request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: ['/admin/:path*', '/api/:path*', '/play/:path*'],
};

