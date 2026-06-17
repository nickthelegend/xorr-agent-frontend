import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-xr-bg-elev-1 border border-xr-border rounded-[10px] p-5 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
