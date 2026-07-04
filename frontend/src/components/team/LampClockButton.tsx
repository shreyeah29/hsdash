import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkShift } from "@/hooks/useWorkShift";
import {
  formatClockTime,
  formatCountdown,
  formatDurationHuman,
  fullShiftTargetTime,
  shiftHoursLabel,
  timeUntilFullShift,
  timeUntilShiftEnd,
  workedDuration,
} from "@/lib/shiftHours";
import type { WorkShiftSession } from "@/types/attendance";
import { DeskLampVisual } from "@/components/team/DeskLampVisual";
import "./LampClockButton.css";

type ShiftSummary = {
  clockInAt: Date;
  clockOutAt: Date;
  durationMs: number;
};

function playClickSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
    void ctx.close();
  } catch {
    /* optional */
  }
}

function hapticTap() {
  navigator.vibrate?.(14);
}

function DustParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="lamp-dust" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="lamp-dust__mote"
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [-4 - (i % 5) * 6, -28 - (i % 4) * 10],
            x: [(i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 5), (i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 4)],
          }}
          transition={{
            duration: 2.4 + (i % 5) * 0.35,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function ShiftSummaryCard({
  summary,
  onDismiss,
}: {
  summary: ShiftSummary;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="lamp-summary-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <motion.div
        className="lamp-summary-card"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="lamp-summary-card__eyebrow">Shift complete</p>
        <p className="lamp-summary-card__title">{formatDurationHuman(summary.durationMs)}</p>
        <div className="lamp-summary-card__rows">
          <div>
            <span>Clock in</span>
            <strong>{formatClockTime(summary.clockInAt)}</strong>
          </div>
          <div>
            <span>Clock out</span>
            <strong>{formatClockTime(summary.clockOutAt)}</strong>
          </div>
        </div>
        <button type="button" className="lamp-summary-card__btn" onClick={onDismiss}>
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

export function LampClockButton() {
  const { data, isLoading, clockIn, clockOut } = useWorkShift();
  const [animating, setAnimating] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [tick, setTick] = useState(0);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [lateNotice, setLateNotice] = useState<string | null>(null);
  const pendingClockOut = useRef<WorkShiftSession | null>(null);

  const session = data?.session ?? null;
  const isActive = Boolean(session?.clockInAt && !session.clockOutAt);
  const isCompleted = Boolean(session?.clockInAt && session?.clockOutAt);

  useEffect(() => {
    setLampOn(isActive);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [isActive]);

  const clockInAt = session?.clockInAt ? new Date(session.clockInAt) : null;

  const live = useMemo(() => {
    void tick;
    if (!clockInAt || !isActive) return null;
    const worked = workedDuration(clockInAt);
    const untilLogout = timeUntilFullShift(clockInAt);
    const untilSeven = timeUntilShiftEnd();
    const logoutAt = fullShiftTargetTime(clockInAt);
    return { worked, untilLogout, untilSeven, logoutAt };
  }, [clockInAt, isActive, tick]);

  const handleTap = useCallback(async () => {
    if (animating || isLoading || isCompleted) return;

    if (!isActive) {
      setAnimating(true);
      hapticTap();
      playClickSound();
      try {
        const result = await clockIn.mutateAsync();
        setLateNotice(result.alert?.message ?? null);
        setLampOn(true);
      } catch {
        setLampOn(false);
      } finally {
        window.setTimeout(() => setAnimating(false), 1000);
      }
      return;
    }

    if (!session || !clockInAt) return;
    setAnimating(true);
    hapticTap();
    playClickSound();
    pendingClockOut.current = session;
    setLampOn(false);

    window.setTimeout(async () => {
      try {
        const result = await clockOut.mutateAsync();
        const outAt = new Date(result.session.clockOutAt!);
        const inAt = new Date(result.session.clockInAt);
        setSummary({
          clockInAt: inAt,
          clockOutAt: outAt,
          durationMs: workedDuration(inAt, outAt),
        });
      } catch {
        setLampOn(true);
      } finally {
        pendingClockOut.current = null;
        setAnimating(false);
      }
    }, 900);
  }, [animating, clockIn, clockOut, clockInAt, isActive, isCompleted, isLoading, session]);

  const status = isCompleted
    ? "Shift done"
    : isActive || lampOn
      ? "On shift"
      : "Clocked out";

  const subtitle = useMemo(() => {
    if (isCompleted && session?.clockOutAt) {
      return `Finished at ${formatClockTime(new Date(session.clockOutAt))}`;
    }
    if ((isActive || lampOn) && clockInAt && live) {
      if (live.untilLogout > 0) {
        return `Logout in ${formatCountdown(live.untilLogout)} · until ${formatClockTime(live.logoutAt)}`;
      }
      return "Full shift reached — clock out when you leave";
    }
    if (isActive && clockInAt) {
      return `Shift started at ${formatClockTime(clockInAt)}`;
    }
    return "Tap the lamp to start your shift";
  }, [clockInAt, isActive, isCompleted, lampOn, live, session?.clockOutAt]);

  const timerLabel =
    isActive && live ? `Working for ${formatCountdown(live.worked)}` : null;

  return (
    <div className="lamp-clock">
      <div className="lamp-clock__panel">
        <motion.div
          className="lamp-clock__ambient"
          animate={{
            opacity: lampOn ? 0.95 : 0,
            scale: lampOn ? 1 : 0.85,
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        <button
          type="button"
          className="lamp-clock__hit"
          onClick={() => void handleTap()}
          disabled={animating || isLoading || isCompleted}
          aria-label={lampOn ? "Clock out" : "Clock in"}
        >
          <DeskLampVisual on={lampOn} breathing={lampOn && isActive} />
          <DustParticles active={lampOn} />
        </button>

        <div className="lamp-clock__meta">
          <p className="lamp-clock__hours">Studio · {shiftHoursLabel}</p>
          <p className="lamp-clock__status">{status}</p>
          {timerLabel ? <p className="lamp-clock__timer">{timerLabel}</p> : null}
          <p className="lamp-clock__subtitle">{subtitle}</p>
          {clockInAt && (isActive || lampOn) ? (
            <p className="lamp-clock__started">Started at {formatClockTime(clockInAt)}</p>
          ) : null}
          {lateNotice ? <p className="lamp-clock__late">{lateNotice}</p> : null}
        </div>
      </div>

      <AnimatePresence>
        {summary ? <ShiftSummaryCard summary={summary} onDismiss={() => setSummary(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}
