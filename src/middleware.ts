import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // /map 으로 시작하는 경로는 모두 보호
  if (request.nextUrl.pathname.startsWith('/map') && !user) {
    return Response.redirect(new URL('/login', request.url))
  }

  // /login 접근 시 이미 로그인되어 있다면 홈으로
  if (request.nextUrl.pathname === '/login' && user) {
    return Response.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 아래와 같은 정적 리소스를 제외한 모든 경로에서 미들웨어 실행
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
