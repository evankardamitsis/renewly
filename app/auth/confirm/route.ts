import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    
    if (!token_hash || !type) {
      return NextResponse.redirect(new URL('/error?message=Missing token or type', request.url))
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      return NextResponse.redirect(
        new URL(`/error?message=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // After successful verification, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    return NextResponse.redirect(
      new URL('/error?message=Something went wrong', request.url)
    )
  }
} 