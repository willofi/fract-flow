import { createClient } from '@/utils/supabase/client'

// 기존 코드와의 호환성을 위해 유지하되, 내부적으로는 SSR 지원용 클라이언트를 사용하도록 설정
export const supabase = createClient()
