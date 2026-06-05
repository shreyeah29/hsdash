import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type EventType = "WEDDING" | "OTHER";

export function PublicEnquiryPage() {
  const [eventType, setEventType] = useState<EventType>("WEDDING");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [clientName, setClientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${apiBase}/leads`, {
        eventType,
        brideName,
        groomName,
        clientName,
        phoneNumber,
        eventDate,
        eventLocation,
        message,
        website: honeypot,
      });
      setDone(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.response?.data?.error ?? "Could not send enquiry. Please try again.");
      } else {
        setError("Could not send enquiry. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2400&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">HS Photography</p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-5xl">Begin Your Story</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/75">
            Tell us a little about your celebration and we&apos;ll get in touch with you shortly.
          </p>
        </motion.div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center text-white backdrop-blur-xl"
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h2 className="mt-4 text-xl font-semibold">Thank you</h2>
            <p className="mt-2 text-sm text-white/75">
              Your enquiry has been received. Our team will reach out to you soon.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            onSubmit={onSubmit}
            className="space-y-5 rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl backdrop-blur-xl md:p-10"
          >
            <div className="flex rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
              {(["WEDDING", "OTHER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition",
                    eventType === t ? "bg-zinc-900 text-white shadow" : "text-zinc-600 hover:text-zinc-900",
                  )}
                  onClick={() => setEventType(t)}
                >
                  {t === "WEDDING" ? "Wedding" : "Other"}
                </button>
              ))}
            </div>

            {eventType === "WEDDING" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bride name *">
                  <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} required className="premium-field" />
                </Field>
                <Field label="Groom name *">
                  <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} required className="premium-field" />
                </Field>
              </div>
            ) : (
              <Field label="Client name *">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required className="premium-field" />
              </Field>
            )}

            <Field label="Phone number *">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="premium-field"
                placeholder="+91 …"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event date *">
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="premium-field" />
              </Field>
              <Field label="Event location *">
                <Input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="City / venue"
                />
              </Field>
            </div>

            <Field label="Tell us about your event">
              <textarea
                className="premium-field min-h-[120px] w-full resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your event, venue, plans, expectations, and anything else you'd like us to know."
              />
            </Field>

            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button
              type="submit"
              variant="premium"
              className="h-12 w-full rounded-2xl text-base font-semibold"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send Enquiry"}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
