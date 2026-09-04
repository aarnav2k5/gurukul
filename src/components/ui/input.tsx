import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white", className)} {...props} />;
}
