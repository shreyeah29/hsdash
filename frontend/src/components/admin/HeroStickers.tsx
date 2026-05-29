import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StickerProps = {
  children: ReactNode;
  className?: string;
  rotate?: number;
  delay?: number;
  size?: "sm" | "md" | "lg";
};

function Sticker({ children, className, rotate = 0, delay = 0, size = "md" }: StickerProps) {
  const sizes = {
    sm: "h-11 w-11 text-xl",
    md: "h-14 w-14 text-2xl md:h-16 md:w-16 md:text-3xl",
    lg: "h-[4.5rem] w-[4.5rem] text-3xl md:h-20 md:w-20 md:text-4xl",
  };

  return (
    <motion.div
      className={cn("pointer-events-none absolute select-none", className)}
      initial={{ opacity: 0, scale: 0.6, rotate: rotate - 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate,
        y: [0, -5, 0],
      }}
      transition={{
        opacity: { duration: 0.45, delay },
        scale: { type: "spring", stiffness: 260, damping: 18, delay },
        rotate: { duration: 0.45, delay },
        y: { duration: 3.8 + delay, repeat: Infinity, ease: "easeInOut", delay },
      }}
      aria-hidden
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl border-[3px] border-white bg-gradient-to-br from-white to-violet-50/90 shadow-[0_8px_24px_-6px_rgba(91,33,182,0.35),0_2px_6px_rgba(15,23,42,0.08)]",
          sizes[size],
        )}
        style={{ rotate: `${rotate}deg` }}
      >
        {/* tape strip */}
        <span
          className="absolute -top-2 left-1/2 h-3 w-10 -translate-x-1/2 rounded-sm bg-amber-100/90 shadow-sm ring-1 ring-amber-200/60"
          style={{ transform: `translateX(-50%) rotate(${-rotate * 0.4}deg)` }}
        />
        <span className="relative drop-shadow-sm">{children}</span>
      </div>
    </motion.div>
  );
}

/** Playful wedding-production stickers around the overview hero. */
export function HeroStickers() {
  return (
    <>
      <Sticker className="right-4 top-3 sm:right-8 sm:top-4" rotate={14} delay={0.1} size="lg">
        💍
      </Sticker>
      <Sticker className="right-[38%] top-1 hidden md:flex" rotate={-10} delay={0.35} size="sm">
        ✨
      </Sticker>
      <Sticker className="left-[52%] top-2 hidden lg:flex" rotate={8} delay={0.5} size="sm">
        🎊
      </Sticker>
      <Sticker className="bottom-6 left-4 sm:bottom-8 sm:left-8" rotate={-12} delay={0.2} size="md">
        📸
      </Sticker>
      <Sticker className="bottom-4 right-[42%] hidden sm:flex" rotate={6} delay={0.65} size="sm">
        🎬
      </Sticker>
      <Sticker className="bottom-10 right-6 lg:right-[28%] xl:right-[32%]" rotate={-8} delay={0.4} size="md">
        💐
      </Sticker>
      <Sticker className="top-[42%] right-2 hidden xl:flex" rotate={18} delay={0.8} size="sm">
        ⭐
      </Sticker>
    </>
  );
}
