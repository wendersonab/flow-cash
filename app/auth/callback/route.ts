import { createClient } from "@/lib/supabase/server"
import { getOrCreateUserProfile } from "@/services/authService"
import { NextRequest, NextResponse } from "next/server"

function safeNextPath(value: string | null): string {
  if (!value) return "/auth/verified"
  if (!value.startsWith("/")) return "/auth/verified"
  if (value.startsWith("//")) return "/auth/verified"
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing-code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid-code`)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/auth/error?reason=session`)
  }

  const profile = await getOrCreateUserProfile(user)

  if (!profile.success || !profile.profile) {
    return NextResponse.redirect(`${origin}/auth/error?reason=profile`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
