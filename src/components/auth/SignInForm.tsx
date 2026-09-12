"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { signInSchema, type SignInValues } from "../../lib/validations/auth";

type SignInFormProps = {
  error?: string;
  feedback?: { type: "error" | "success"; message: string } | null;
  loading?: boolean;
  onSubmit: (values: SignInValues) => Promise<void>;
  onStudent: () => void;
  onFieldChange: () => void;
};

export function SignInForm({ error, feedback, loading, onSubmit, onStudent, onFieldChange }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });
  const busy = Boolean(loading || isSubmitting);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Email
          <Input {...register("email", { onChange: onFieldChange })} type="email" autoComplete="username" aria-invalid={Boolean(errors.email)} />
          {errors.email && <small className="field-error">{errors.email.message}</small>}
        </label>
        <label>
          Password
          <span className="password-field">
            <Input {...register("password", { onChange: onFieldChange })} type={showPassword ? "text" : "password"} autoComplete="current-password" aria-invalid={Boolean(errors.password)} onKeyDown={(event) => setCapsLock(event.getModifierState?.("CapsLock") || false)} onKeyUp={(event) => setCapsLock(event.getModifierState?.("CapsLock") || false)} onBlur={() => setCapsLock(false)} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {capsLock && <small className="caps-warning">Caps Lock is on</small>}
          {errors.password && <small className="field-error">{errors.password.message}</small>}
        </label>
        {(error || feedback) && <p className={cn("auth-feedback", feedback?.type || "error")} role={feedback?.type === "success" ? "status" : "alert"}>{feedback?.message || error}</p>}
        <Button className="primary full" disabled={busy} aria-busy={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button variant="secondary" className="student-button" onClick={onStudent}>
        <GraduationCap size={16} /> I’m a student — enter library
      </Button>
    </>
  );
}
