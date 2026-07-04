import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useWorkShift } from "@/hooks/useWorkShift";
import { formatClockTime, formatDurationHuman, workedDuration } from "@/lib/shiftHours";
import type { WorkShiftSession } from "@/types/attendance";
import { DeskLampVisual, type LampPhase } from "@/components/team/DeskLampVisual";
import "./LampClockButton.css";

type ShiftSummary = {
  clockInAt: Date;
  clockOutAt: Date;
  durationMs: number;
};

const TRANSITION_MS = 950;

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
        <div className="lamp-summary-card__header">
          <Calendar className="h-4 w-4" aria-hidden />
          <span>Shift Summary</span>
        </div>
        <div className="lamp-summary-card__rows">
          <div>
            <span>Clock In</span>
            <strong>{formatClockTime(summary.clockInAt)}</strong>
          </div>
          <div>
            <span>Clock Out</span>
            <strong>{formatClockTime(summary.clockOutAt)}</strong>
          </div>
          <div className="lamp-summary-card__total">
            <span>Total Duration</span>
            <strong>{formatDurationHuman(summary.durationMs)}</strong>
          </div>
        </div>
        <button type="button" className="lamp-summary-card__btn" onClick={onDismiss}>
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

function StatusBadge({ phase, completed }: { phase: LampPhase; completed: boolean }) {
  if (phase === "opening" || phase === "closing") {
    return (
      <div className="lamp-clock__wait">
        <p className="lamp-clock__wait-label">Please wait</p>
        <div className="lamp-clock__progress">
          <motion.div
            className="lamp-clock__progress-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: TRANSITION_MS / 1000, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (phase === "on") {
    return (
      <p className="lamp-clock__badge lamp-clock__badge--on">
        <span className="lamp-clock__dot lamp-clock__dot--on" />
        On shift
      </p>
    );
  }

  return (
    <p className="lamp-clock__badge lamp-clock__badge--off">
      <span className="lamp-clock__dot lamp-clock__dot--off" />
      {completed ? "Logged out" : "Clocked out"}
    </p>
  );
}

export function LampClockButton() {
  const { data, isLoading, clockIn, clockOut } = useWorkShift();
  const [phase, setPhase] = useState<LampPhase>("off");
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [lateNotice, setLateNotice] = useState<string | null>(null);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const pendingClockOut = useRef<WorkShiftSession | null>(null);

  const session = data?.session ?? null;
  const isActive = Boolean(session?.clockInAt && !session.clockOutAt);
  const isCompleted = Boolean(session?.clockInAt && session?.clockOutAt);
  const isBusy = phase === "opening" || phase === "closing" || isLoading;

  useEffect(() => {
    if (isBusy) return;
    if (isActive) {
      setPhase("on");
      setJustLoggedOut(false);
    } else if (!summary) {
      setPhase("off");
    }
  }, [isActive, isBusy, summary]);

  const clockInAt = session?.clockInAt ? new Date(session.clockInAt) : null;

  const copy = useMemo(() => {
    if (phase === "opening") {
      return { title: "Welcome", subtitle: "Opening your shift…" };
    }
    if (phase === "closing") {
      return { title: "Logging out…", subtitle: "Closing your shift." };
    }
    if (phase === "on") {
      return { title: "Welcome back", subtitle: "You are now on shift." };
    }
    if (justLoggedOut || (isCompleted && !summary)) {
      return { title: "Goodbye!", subtitle: "You have been logged out." };
    }
    return { title: "Welcome", subtitle: "Tap the lamp to start your shift." };
  }, [isCompleted, justLoggedOut, phase, summary]);

  const handleTap = useCallback(async () => {
    if (isBusy || isCompleted) return;

    if (phase === "off") {
      hapticTap();
      playClickSound();
      setPhase("opening");
      setJustLoggedOut(false);

      window.setTimeout(async () => {
        try {
          const result = await clockIn.mutateAsync();
          setLateNotice(result.alert?.message ?? null);
          setPhase("on");
        } catch {
          setPhase("off");
        }
      }, TRANSITION_MS);
      return;
    }

    if (phase !== "on" || !session || !clockInAt) return;

    hapticTap();
    playClickSound();
    setPhase("closing");
    pendingClockOut.current = session;

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
        setJustLoggedOut(true);
        setPhase("off");
      } catch {
        setPhase("on");
      } finally {
        pendingClockOut.current = null;
      }
    }, TRANSITION_MS);
  }, [clockIn, clockOut, clockInAt, isBusy, isCompleted, phase, session]);

  return (
    <div className="lamp-clock">
      <div className="lamp-clock__panel">
        <div className={`lamp-clock__stage${phase !== "off" ? " lamp-clock__stage--lit" : ""}`}>
          <motion.div
            className="lamp-clock__hit"
            onClick={() => void handleTap()}
            role="button"
            tabIndex={isBusy || isCompleted ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void handleTap();
              }
            }}
            aria-disabled={isBusy || isCompleted}
            aria-label={phase === "on" ? "Clock out" : "Clock in"}
            whileTap={isBusy || isCompleted ? undefined : { scale: 0.985 }}
          >
            <DeskLampVisual phase={phase} breathing={phase === "on"} />
          </motion.div>
        </div>

        <div className="lamp-clock__meta">
          <p className="lamp-clock__title">{copy.title}</p>
          {phase !== "on" ? <p className="lamp-clock__subtitle">{copy.subtitle}</p> : null}

          {phase === "opening" || phase === "closing" ? (
            <StatusBadge phase={phase} completed={isCompleted || justLoggedOut} />
          ) : phase === "off" ? (
            <StatusBadge phase={phase} completed={isCompleted || justLoggedOut} />
          ) : null}

          {clockInAt && phase === "on" ? (
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
