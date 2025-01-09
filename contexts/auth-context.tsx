"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode
} from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            setUser(user)
            return user
        } catch (error) {
            console.error("Error refreshing user:", error)
            setUser(null)
            return null
        }
    }, [supabase.auth])

    // Sign out
    const signOut = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            setUser(null)
            router.push("/login")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }, [supabase.auth, router])

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await refreshUser()
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        // Subscribe to auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user)
            } else {
                setUser(null)
            }
            router.refresh()
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth, refreshUser, router])

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                signOut,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
} 