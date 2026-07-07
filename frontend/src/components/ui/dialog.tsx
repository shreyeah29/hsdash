import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-hidden p-4 pt-12 pb-12 md:items-center md:py-16"
        role="presentation"
        data-lenis-prevent
      >
        <button
          type="button"
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm focus:outline-none"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-10 w-full shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body,
  );
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  showClose?: boolean;
};

export function DialogContent({ className, showClose = true, children, ...props }: DialogContentProps) {
  const ctx = React.useContext(DialogContext);

  return (
    <div
      data-lenis-prevent
      className={cn(
        "relative mx-auto max-h-[min(90vh,calc(100dvh-4rem))] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/10",
        showClose && "pt-6",
        className,
      )}
      {...props}
    >
      {showClose && ctx ? (
        <button
          type="button"
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] transition hover:bg-zinc-50"
          aria-label="Close"
          onClick={() => ctx.onOpenChange(false)}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-tight text-zinc-900", className)} {...props} />;
}
