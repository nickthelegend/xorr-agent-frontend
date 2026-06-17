import React from "react";
import clsx from "clsx";

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function SectionLabel({ children, className, ...props }: SectionLabelProps) {
  return (
    <div
      className={clsx(
        "font-mono text-[10px] uppercase tracking-[0.18em] text-xr-text-faint select-none pb-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
