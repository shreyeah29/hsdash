import * as React from "react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export type MovingBorderProps = {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  borderWidth?: number;
  gradientWidth?: number;
  radius?: number;
  duration?: number;
  colors?: string[];
  isCircle?: boolean;
};

export function MovingBorder({
  children,
  className,
  outerClassName,
  borderWidth = 1,
  radius = 15,
  gradientWidth,
  duration = 3,
  colors = ["#355bd2"],
  isCircle = false,
}: MovingBorderProps) {
  const scope = useRef<HTMLDivElement>(null);
  const effectiveRadius = isCircle ? 9999 : radius;

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const movingGradient = root.querySelector<HTMLElement>(".moving-gradient");
      if (!movingGradient) return;

      let pathTl: gsap.core.Timeline | null = null;
      let colorTl: gsap.core.Timeline | null = null;

      const updateAnimation = () => {
        if (pathTl) pathTl.kill();

        const rect = root.getBoundingClientRect();
        const width = rect.width - borderWidth * 2;
        const height = rect.height - borderWidth * 2;

        let path: { x: number; y: number }[];

        if (isCircle) {
          const centerX = width / 2;
          const centerY = height / 2;
          const circleRadius = Math.min(width, height) / 2;
          const numPoints = 64;

          path = Array.from({ length: numPoints }, (_, i) => {
            const angle = (i / numPoints) * Math.PI * 2;
            return {
              x: centerX + circleRadius * Math.cos(angle),
              y: centerY + circleRadius * Math.sin(angle),
            };
          });
        } else {
          path = [
            { x: effectiveRadius, y: 0 },
            { x: width - effectiveRadius, y: 0 },
            { x: width, y: effectiveRadius },
            { x: width, y: height - effectiveRadius },
            { x: width - effectiveRadius, y: height },
            { x: effectiveRadius, y: height },
            { x: 0, y: height - effectiveRadius },
            { x: 0, y: effectiveRadius },
            { x: effectiveRadius, y: 0 },
          ];
        }

        pathTl = gsap.timeline({
          repeat: -1,
          defaults: { ease: "none", duration },
        });

        pathTl.to(movingGradient, {
          motionPath: {
            path,
            fromCurrent: false,
            curviness: isCircle ? 1 : 1.5,
          },
        });
      };

      const setupColorAnimation = () => {
        if (colors.length <= 1) {
          root.style.setProperty("--color", colors[0]);
          return;
        }

        root.style.setProperty("--color", colors[0]);

        colorTl = gsap.timeline({
          repeat: -1,
          defaults: { ease: "none", duration: duration / colors.length },
        });

        colors.forEach((_, index) => {
          const nextColor = colors[(index + 1) % colors.length];
          colorTl!.to(root, { "--color": nextColor });
        });
      };

      updateAnimation();
      setupColorAnimation();

      const resizeObserver = new ResizeObserver(() => {
        updateAnimation();
      });

      resizeObserver.observe(root);

      return () => {
        pathTl?.kill();
        colorTl?.kill();
        resizeObserver.disconnect();
      };
    },
    { scope, dependencies: [borderWidth, effectiveRadius, gradientWidth, duration, colors, isCircle] },
  );

  return (
    <div
      ref={scope}
      className={cn("wrapper relative overflow-hidden", outerClassName)}
      style={
        {
          "--color": colors[0],
          padding: `${borderWidth}px`,
          borderRadius: `${effectiveRadius + borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className="moving-gradient absolute left-0 top-0 aspect-square" style={{ width: `${borderWidth}px` }}>
        <div
          className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${gradientWidth ?? borderWidth * 10}px`,
            background: "radial-gradient(circle, var(--color) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className={cn("inner relative z-30 bg-white", className)}
        style={{
          borderRadius: `${effectiveRadius}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
