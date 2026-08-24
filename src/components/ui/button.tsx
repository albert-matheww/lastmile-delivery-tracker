import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-display font-medium tracking-wide transition-all disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-route/40 active:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "bg-route text-white shadow-[0_2px_0_0_rgba(27,58,92,0.55)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_rgba(27,58,92,0.55)] active:shadow-[0_1px_0_0_rgba(27,58,92,0.55)]",
        secondary:
          "bg-paper-raised text-ink border-[1.5px] border-ink/70 hover:-translate-y-0.5 hover:bg-white",
        ghost: "text-ink hover:bg-ink/5",
        danger:
          "bg-manifest text-white shadow-[0_2px_0_0_rgba(178,58,46,0.55)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_rgba(178,58,46,0.55)] active:shadow-[0_1px_0_0_rgba(178,58,46,0.55)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
