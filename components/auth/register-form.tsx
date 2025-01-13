'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function RegisterForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const email = formData.get('email') as string
            const password = formData.get('password') as string

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            // If identities is empty array, user already exists
            if (data?.user?.identities?.length === 0) {
                toast.error('Email already registered')
                return
            }

            toast.success('Check your email to confirm your account')
            router.push('/verify-email')
        } catch (error) {
            console.error(error)
            toast.error(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    disabled={loading}
                    minLength={8}
                />
                <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters long
                </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Log in
                </Link>
            </div>
        </form>
    )
} 