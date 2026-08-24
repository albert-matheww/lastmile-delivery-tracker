import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-10 w-full rounded-[3px] border-[1.5px] border-border bg-white px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted focus-visible:border-route focus-visible:ring-2 focus-visible:ring-route/15 disabled:opacity-50";

/** Monospace styling for codes/figures — pincodes, weights, dimensions, tracking numbers. */
const monoFieldClass = "font-manifest tabular-nums";

export function Input({
  className,
  mono,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input className={cn(fieldClass, mono && monoFieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "h-auto min-h-16 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft",
        className
      )}
      {...props}
    />
  );
}
