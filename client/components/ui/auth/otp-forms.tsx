"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, Input, Label, PasswordInput } from "./primitives";

// ── OTP Verify Form ───────────────────────────────────────────────────────────
export interface OtpVerifyFormProps {
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onBack: () => void;
  error?: string;
  loading?: boolean;
  purpose?: "signup" | "forgot_password";
}

export function OtpVerifyForm({ email, onSubmit, onBack, error, loading, purpose = "signup" }: OtpVerifyFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handleChange = (i: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = char; setDigits(next);
    if (char && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(digits.join("")); }} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
          <MailCheck className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{purpose === "signup" ? "Verify your email" : "Enter reset code"}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. It expires in 10 minutes.
        </p>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">{error}</div>}

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { inputsRef.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className="w-11 text-center text-xl font-bold rounded-lg border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            style={{ height: "52px" }} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" variant="default" disabled={loading || !digits.every(Boolean)}>
          {loading ? "Verifying…" : purpose === "signup" ? "Verify & Create Account" : "Verify Code"}
        </Button>
        <button type="button" onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    </form>
  );
}

// ── Forgot Password Form ──────────────────────────────────────────────────────
export interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  error?: string;
  loading?: boolean;
}

export function ForgotPasswordForm({ onSubmit, onBack, error, loading }: ForgotPasswordFormProps) {
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(new FormData(e.currentTarget).get("email") as string); }} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Forgot password?</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your email and we'll send you a reset code.</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">{error}</div>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>{loading ? "Sending…" : "Send Reset Code"}</Button>
        <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </button>
      </div>
    </form>
  );
}

// ── Reset Password Form ───────────────────────────────────────────────────────
export interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

export function ResetPasswordForm({ onSubmit, error, loading }: ResetPasswordFormProps) {
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(new FormData(e.currentTarget).get("password") as string); }} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-balance text-sm text-muted-foreground">Must be at least 8 characters.</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">{error}</div>}
      <div className="grid gap-4">
        <PasswordInput name="password" label="New Password" required autoComplete="new-password" placeholder="New password" />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>{loading ? "Saving…" : "Update Password"}</Button>
      </div>
    </form>
  );
}
