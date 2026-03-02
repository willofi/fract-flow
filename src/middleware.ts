import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/proxy';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Handle i18n
  const intlResponse = intlMiddleware(request);

  // 2. Handle Supabase Session (i18nResponse를 전달하여 쿠키를 입힙니다)
  const { supabaseResponse } = await updateSession(request, intlResponse as NextResponse);

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they contain a dot, e.g. `favicon.ico`
    // - /api, /_next, /_vercel
    // - all root files: /favicon.ico, /icon.png, etc.
    '/((?!api|_next|_vercel|_not-found|.*\\..*).*)',
  ],
};
