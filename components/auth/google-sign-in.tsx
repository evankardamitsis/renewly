'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GoogleCredentialResponse {
    credential: string
    select_by: string
    client_id: string
}

interface GoogleButtonOptions {
    theme: 'outline' | 'filled_blue' | 'filled_black'
    size: 'large' | 'medium' | 'small'
    type: 'standard' | 'icon'
    text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape: 'rectangular' | 'pill' | 'circle' | 'square'
}

export function GoogleSignIn() {
    const router = useRouter()
    const supabase = createClient()

    // Generate nonce for security
    const generateNonce = async (): Promise<[string, string]> => {
        const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
        const encoder = new TextEncoder()
        const encodedNonce = encoder.encode(nonce)
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        return [nonce, hashedNonce]
    }

    useEffect(() => {
        const initializeGoogleSignIn = async () => {
            const [nonce, hashedNonce] = await generateNonce()

            // Check if there's an existing session
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                console.error('Error checking session:', error)
            }
            if (session) {
                router.push('/dashboard')
                return
            }

            // Initialize Google Sign-In
            window.google?.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                callback: async (response: GoogleCredentialResponse) => {
                    try {
                        const { error } = await supabase.auth.signInWithIdToken({
                            provider: 'google',
                            token: response.credential,
                            nonce: nonce,
                        })

                        if (error) throw error
                        router.push('/dashboard')
                    } catch (error) {
                        console.error('Error signing in with Google:', error)
                    }
                },
                nonce: hashedNonce,
                use_fedcm_for_prompt: true // For Chrome's third-party cookie phase-out
            })

            // Render the button
            window.google?.accounts.id.renderButton(
                document.getElementById('google-signin-button')!,
                {
                    theme: 'outline',
                    size: 'large',
                    type: 'standard',
                    text: 'signin_with',
                    shape: 'pill',
                } as GoogleButtonOptions
            )

            // Also display One Tap prompt
            window.google?.accounts.id.prompt()
        }

        initializeGoogleSignIn()
    }, [router, supabase.auth])

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                async
                defer
                strategy="afterInteractive"
            />
            <div id="google-signin-button" className="flex justify-center" />
        </>
    )
}

// Add TypeScript declarations for Google's GSI client
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string
                        callback: (response: GoogleCredentialResponse) => void
                        nonce?: string
                        use_fedcm_for_prompt?: boolean
                    }) => void
                    renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void
                    prompt: () => void
                }
            }
        }
    }
} 