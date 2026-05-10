import * as React from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return open ? (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">{children}</div>
    </div>
  ) : null;
}

export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-2xl border border-white/12 bg-zinc-900/85 p-6 shadow-2xl backdrop-blur-2xl",
        className,
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-tight text-white", className)} {...props} />;
}

