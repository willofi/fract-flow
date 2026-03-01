import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: getUser()를 호출해야 세션이 유효한지 확인하고 새로고침할 수 있습니다.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인하지 않은 사용자가 /login이 아닌 페이지에 접근할 때 처리 로직을 여기에 추가할 수 있습니다.
  // 하지만 여기서는 세션 갱신만 담당하고, 페이지 레벨 리다이렉트는 루트 middleware.ts에서 처리하겠습니다.

  return { supabaseResponse, user }
}
