"use client";

import * as React from "react";
import { useState } from "react";
import { Button, Input, Label, PasswordInput } from "./primitives";

// ── Sign In Form ──────────────────────────────────────────────────────────────
export interface SignInFormProps {
  onSubmit: (data: { username: string; password: string }) => Promise<void>;
  onForgotPassword?: () => void;
  error?: string;
  loading?: boolean;
}

export function SignInForm({ onSubmit, onForgotPassword, error, loading }: SignInFormProps) {
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await onSubmit({ username: data.get("email") as string, password: data.get("password") as string });
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your email below to sign in</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">{error}</div>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email or Username</Label>
          <Input id="email" name="email" type="text" placeholder="m@example.com" required autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password-signin">Password</Label>
          <PasswordInput id="password-signin" name="password" required autoComplete="current-password" placeholder="Password" />
          {onForgotPassword && (
            <button type="button" onClick={onForgotPassword} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-right w-full">
              Forgot password?
            </button>
          )}
        </div>
        <Button type="submit" variant="default" className="mt-2" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

// ── Sign Up Form ──────────────────────────────────────────────────────────────
export interface SignUpFormProps {
  onSubmit: (data: { username: string; email: string; password: string }) => Promise<void>;
  error?: string;
  loading?: boolean;
}

export function SignUpForm({ onSubmit, error, loading }: SignUpFormProps) {
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await onSubmit({ username: data.get("name") as string, email: data.get("email") as string, password: data.get("password") as string });
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive border border-destructive/20">{error}</div>}
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Username</Label>
          <Input id="name" name="name" type="text" placeholder="johndoe" required autoComplete="username" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Password" required autoComplete="new-password" placeholder="Password" />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </Button>
      </div>
    </form>
  );
}

// ── Auth Form Container + AuthUI ──────────────────────────────────────────────
interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignIn: SignInFormProps["onSubmit"];
  onSignUp: SignUpFormProps["onSubmit"];
  onForgotPassword?: () => void;
  error?: string;
  loading?: boolean;
}

function AuthFormContainer({ isSignIn, onToggle, onSignIn, onSignUp, onForgotPassword, error, loading }: AuthFormContainerProps) {
  return (
    <div className="mx-auto grid w-full gap-2">
      {isSignIn
        ? <SignInForm onSubmit={onSignIn} onForgotPassword={onForgotPassword} error={error} loading={loading} />
        : <SignUpForm onSubmit={onSignUp} error={error} loading={loading} />
      }
      <div className="text-center text-sm">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-foreground" onClick={onToggle} type="button">
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}

export interface AuthUIProps {
  defaultSignIn?: boolean;
  onSignIn: SignInFormProps["onSubmit"];
  onSignUp: SignUpFormProps["onSubmit"];
  onForgotPassword?: () => void;
  error?: string;
  loading?: boolean;
}

export function AuthUI({ defaultSignIn = true, onSignIn, onSignUp, onForgotPassword, error, loading }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(defaultSignIn);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <style>{`input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none; }`}</style>
      <div className="w-full max-w-[400px] rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 p-5 sm:p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" /></svg>
          </div>
          <span className="font-bold text-base tracking-tight">Onhandl</span>
        </div>
        <AuthFormContainer
          isSignIn={isSignIn} onToggle={() => setIsSignIn((p) => !p)}
          onSignIn={onSignIn} onSignUp={onSignUp} onForgotPassword={onForgotPassword}
          error={error} loading={loading}
        />
      </div>
    </div>
  );
}
