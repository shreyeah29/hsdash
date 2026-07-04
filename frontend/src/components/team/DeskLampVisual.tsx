import { motion } from "framer-motion";
import "./DeskLampVisual.css";

type DeskLampVisualProps = {
  on: boolean;
  breathing?: boolean;
};

export function DeskLampVisual({ on, breathing = false }: DeskLampVisualProps) {
  return (
    <div className={`desk-lamp ${on ? "desk-lamp--on" : ""} ${breathing ? "desk-lamp--breathing" : ""}`} aria-hidden>
      <motion.div
        className="desk-lamp__light-pool"
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="desk-lamp__desk-shadow" />

      <div className="desk-lamp__base">
        <div className="desk-lamp__base-rim" />
        <div className="desk-lamp__stem" />
      </div>

      <motion.div
        className="desk-lamp__arm-lower"
        animate={{ rotate: on ? 14 : -6 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="desk-lamp__joint desk-lamp__joint--a" />
        <motion.div
          className="desk-lamp__arm-upper"
          animate={{ rotate: on ? 38 : 8 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <div className="desk-lamp__joint desk-lamp__joint--b" />
          <motion.div
            className="desk-lamp__shade-assembly"
            animate={{ rotate: on ? 6 : -22 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <div className="desk-lamp__shade">
              <div className="desk-lamp__shade-inner" />
              <motion.div
                className="desk-lamp__bulb"
                animate={{
                  opacity: on ? 1 : 0.2,
                  boxShadow: on
                    ? "0 0 22px 8px rgba(255, 210, 120, 0.95), 0 0 48px 16px rgba(255, 180, 80, 0.45)"
                    : "0 0 0 transparent",
                }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />
              <motion.div
                className="desk-lamp__filament"
                animate={{ opacity: on ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="desk-lamp__shade-cap" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="desk-lamp__beam"
        animate={{ opacity: on ? 0.9 : 0 }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
}
