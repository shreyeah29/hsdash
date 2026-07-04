import { motion } from "framer-motion";
import "./DeskLampVisual.css";

type DeskLampVisualProps = {
  on: boolean;
  breathing?: boolean;
};

const spring = { type: "spring" as const, stiffness: 200, damping: 20 };

/**
 * Front-facing desk lamp: base stays fixed, head assembly swings on a hinge.
 * Off = shade tilted back. On = shade tipped forward with warm pool on the desk.
 */
export function DeskLampVisual({ on, breathing = false }: DeskLampVisualProps) {
  return (
    <div className={`lamp-scene ${on ? "lamp-scene--on" : ""} ${breathing ? "lamp-scene--breathing" : ""}`}>
      <motion.div
        className="lamp-scene__room-glow"
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ duration: 0.7 }}
      />

      <motion.div
        className="lamp-scene__pool"
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.55 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="lamp-scene__cone"
        initial={false}
        animate={{ opacity: on ? 0.75 : 0 }}
        transition={{ duration: 0.75 }}
      />

      {/* fixed base */}
      <div className="lamp-scene__base-shadow" />
      <div className="lamp-scene__base">
        <div className="lamp-scene__base-top" />
      </div>

      {/* swinging head — pivot at hinge on base */}
      <motion.div
        className="lamp-scene__rig"
        initial={false}
        animate={{ rotate: on ? 72 : -68 }}
        transition={spring}
        style={{ transformOrigin: "50% 100%" }}
      >
        <div className="lamp-scene__stem" />
        <div className="lamp-scene__hinge" />
        <div className="lamp-scene__arm" />
        <div className="lamp-scene__shade">
          <div className="lamp-scene__shade-rim" />
          <div className="lamp-scene__shade-inner" />
          <motion.div
            className="lamp-scene__bulb"
            initial={false}
            animate={{
              opacity: on ? 1 : 0.2,
              boxShadow: on
                ? "0 0 20px 6px rgba(255, 210, 120, 0.95), 0 0 40px 12px rgba(255, 180, 70, 0.4)"
                : "0 0 0 transparent",
            }}
            transition={{ duration: 0.65 }}
          />
          <motion.div
            className="lamp-scene__filament"
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
