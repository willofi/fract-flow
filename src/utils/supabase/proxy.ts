import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, i18nResponse?: NextResponse) {
  // 1. i18n 응답이 있으면 그것을 사용하고, 없으면 기본 응답을 생성합니다.
  const supabaseResponse = i18nResponse || NextResponse.next({
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
          
          // 기존 응답 객체에 쿠키를 설정합니다.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신을 위해 getUser() 호출
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
