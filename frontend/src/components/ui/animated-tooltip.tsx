import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export type AnimatedTooltipItem = {
  id: number;
  name: string;
  designation: string;
  image: string;
};

export function AnimatedTooltip({
  items,
  className,
  onSelect,
  selectedId,
}: {
  items: AnimatedTooltipItem[];
  className?: string;
  onSelect?: (item: AnimatedTooltipItem) => void;
  selectedId?: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event: MouseEvent<HTMLImageElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className="group relative -mr-4 border-0 bg-transparent p-0 first:ml-0"
            onMouseEnter={() => setHoveredIndex(item.id)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSelect?.(item)}
            aria-label={`Select ${item.name}`}
          >
            <AnimatePresence mode="popLayout">
              {hoveredIndex === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 260, damping: 10 },
                  }}
                  exit={{ opacity: 0, y: 20, scale: 0.6 }}
                  style={{ translateX, rotate, whiteSpace: "nowrap" }}
                  className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md border-2 border-black bg-black px-4 py-2 text-xs shadow-xl"
                >
                  <div className="relative z-30 text-base font-bold text-white">{item.name}</div>
                  <div className="relative z-30 text-xs text-zinc-300">{item.designation}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <img
              onMouseMove={handleMouseMove}
              src={item.image}
              alt={item.name}
              className={cn(
                "relative m-0 h-16 w-16 rounded-full border-2 border-black object-cover object-top p-0 transition duration-500 group-hover:z-30 group-hover:scale-105 lg:h-20 lg:w-20",
                isSelected ? "ring-2 ring-[#5227ff] ring-offset-2" : "bg-white",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
