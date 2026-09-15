import { createRouteHandlerClient } from '@/lib/supabase/route-client'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient({ cookies: () => cookieStore })
    const {error} = await supabase.auth.exchangeCodeForSession(code)
    if(error)return NextResponse.redirect(new URL('/login?erro=link-invalido',request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
