import { NextResponse } from 'next/server'
// The client you created from the server-side auth guide
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // 에러 발생 시 리다이렉트
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-failed`)
}
