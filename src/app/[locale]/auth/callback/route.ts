import { NextResponse } from 'next/server'
// The client you created from the server-side auth guide
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // CSRF 방지용
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // Local 개발 환경에서는 forwardedHost 무시 가능
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 에러 발생 시 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
