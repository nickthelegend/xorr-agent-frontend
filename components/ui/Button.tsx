import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "outline-mint" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({
  children,
  className,
  variant = "outline",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-mono font-medium tracking-wide uppercase select-none rounded-[6px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "text-[10px] px-2.5 py-1.5": size === "sm",
          "text-xs px-4 py-2": size === "md",
          "text-sm px-6 py-3": size === "lg",
        },
        {
          "bg-xr-mint hover:bg-xr-mint-dim text-xr-bg font-semibold": variant === "primary",
          "bg-xr-bg-elev-2 border border-xr-border text-xr-text hover:bg-xr-bg-elev-1":
            variant === "secondary",
          "border border-xr-border text-xr-text-dim hover:text-xr-text hover:border-xr-border-strong":
            variant === "outline",
          "border border-xr-mint/30 text-xr-mint hover:bg-xr-mint/10 hover:border-xr-mint/60":
            variant === "outline-mint",
          "border border-xr-loss/30 text-xr-loss hover:bg-xr-loss/10 hover:border-xr-loss/60":
            variant === "danger",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
