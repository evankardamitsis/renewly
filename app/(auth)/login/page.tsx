"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <LoginForm />
    </div>
  );
}
