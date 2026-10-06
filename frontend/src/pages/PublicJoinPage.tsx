import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import "./PublicEnquiryPage.css";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const ROLES = [
  "PHOTOGRAPHER",
  "CINEMATOGRAPHER",
  "VIDEO EDITOR",
  "GRAPHIC DESIGNER",
  "SOCIAL MEDIA MANAGER",
  "PRODUCTION ASSISTANT",
  "INTERN",
  "CREATIVE DIRECTOR",
] as const;

const EXPERIENCE = ["", "FRESHER", "1-3 YEARS", "5+ YEARS"] as const;

export function PublicJoinPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleApplied, setRoleApplied] = useState("");
  const [softwares, setSoftwares] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await axios.post(`${apiBase}/careers`, {
        name,
        email,
        phoneNumber,
        roleApplied,
        softwares,
        experience,
        portfolioUrl,
        instagramLink,
        source: "WEBSITE",
        website: honeypot,
      });
      setDone(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Could not send your application. Please try again.");
      } else {
        setError("Could not send your application. Please try again.");
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center text-white backdrop-blur-xl"
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h2 className="mt-4 text-xl font-semibold">Application received</h2>
            <p className="mt-2 text-sm text-white/75">
              Thank you. The HSWF team will review your application and reach out if there is a fit.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 text-center text-white"
            >
              <img
                src="/hswf_logo_white_transparent.png"
                alt="HSWF"
                className="mx-auto mb-3 h-auto w-[min(100%,16rem)] object-contain sm:w-[min(100%,19rem)]"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Join us</p>
              <h1 className="mt-3 text-xl font-medium text-white/95 md:text-2xl">
                Most people attend weddings. A few observe moments before they happen.
              </h1>
              <p className="mt-2 text-sm text-white/70">If you belong to the second category, continue.</p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              onSubmit={onSubmit}
              className="space-y-5 rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl backdrop-blur-xl md:p-10"
            >
              <Field label="Email *">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="premium-field" autoComplete="name" />
              </Field>

              <Field label="Contact number *">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="+91 …"
                  autoComplete="tel"
                />
              </Field>

              <Field label="Role *">
                <select
                  required
                  value={roleApplied}
                  onChange={(e) => setRoleApplied(e.target.value)}
                  className={cn("premium-field w-full", !roleApplied && "text-zinc-400")}
                >
                  <option value="">Select a role</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Softwares you are good at *">
                <Input
                  value={softwares}
                  onChange={(e) => setSoftwares(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="Lightroom, Premiere, Photoshop…"
                />
              </Field>

              <Field label="Experience">
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="premium-field w-full"
                >
                  {EXPERIENCE.map((option) => (
                    <option key={option || "none"} value={option}>
                      {option || "Select experience"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Portfolio *">
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="Drive / website / YouTube links"
                />
              </Field>

              <Field label="Instagram link *">
                <Input
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  required
                  className="premium-field"
                  placeholder="https://instagram.com/…"
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
                {submitting ? "Sending…" : "Submit application"}
              </Button>
            </motion.form>
          </>
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
