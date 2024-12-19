"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Check your email</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            We&apos;ve sent you a verification link to your email address.
            Please check your inbox and click the link to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link href="/login" className="w-full">
            <Button className="w-full" variant="outline">
              Back to login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 