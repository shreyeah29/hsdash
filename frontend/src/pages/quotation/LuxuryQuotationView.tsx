import { useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Clock,
  Film,
  Heart,
  Play,
  Users,
} from "lucide-react";
import { PACKAGE_NOTES, TESTIMONIALS } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";
import "./luxury-quotation.css";

const PILLARS = [
  { icon: Camera, title: "Story First", body: "Every frame crafted to feel like your story—not a template." },
  { icon: Users, title: "Dedicated Team", body: "Lead photographers and filmmakers assigned to your celebration." },
  { icon: Heart, title: "Natural Emotions", body: "Unposed, honest moments captured with quiet presence." },
  { icon: Clock, title: "Fast & Reliable", body: "Clear timelines, consistent delivery, proactive communication." },
  { icon: Film, title: "Cinematic Editing", body: "Films shaped with film-industry sensibility and emotional pacing." },
];

const FILMS = [
  { names: "Ananya & Kiran", place: "Hyderabad", image: "/quotation/page-09-img-0.jpeg" },
  { names: "Priya & Rahul", place: "Bengaluru", image: "/quotation/page-09-img-2.jpeg" },
  { names: "Sneha & Arjun", place: "Chennai", image: "/quotation/page-09-img-3.png" },
  { names: "Featured Film", place: "Harishankar", image: "/quotation/page-05-img-0.jpeg" },
];

const TESTIMONIAL_AVATARS = [
  "/quotation/page-09-img-1.png",
  "/quotation/page-10-img-0.jpeg",
  "/quotation/page-10-img-1.jpeg",
];

const PACKAGE_FEATURES = [
  "Complete Wedding Day Coverage",
  "Cinematic Wedding Film",
  "Instagram Reels",
  "Premium Photo Album",
  "Engagement / Pre-Wedding Shoot",
  "Dedicated Creative Team",
];

const FAQ = [
  { q: "Do you travel for weddings?", a: "Yes — we cover celebrations across India and internationally. Travel and stay for out-of-city events are arranged by the client." },
  { q: "How many photographers will be present?", a: "Team size is listed per event in your proposal below, typically including lead photographer, candid, traditional, and videography." },
  { q: "When will we receive photos and films?", a: "A glimpse within 7–10 days per event. Full curated galleries and films within 100 days from your last event." },
  { q: "Can we request changes to this proposal?", a: "Absolutely. Tap Request Revision and our team will prepare an updated version for you." },
  { q: "What are your payment terms?", a: "Booking advance secures your dates. Subsequent payments are scheduled as listed in your Investment section." },
  { q: "How do we book you?", a: "Accept this proposal or contact us on WhatsApp. We'll confirm dates upon receiving the booking advance." },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatHeroDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).toUpperCase();
}

function eventIcon(name: string) {
  const n = name.toUpperCase();
  if (n.includes("HALDI")) return "🌼";
  if (n.includes("MEHENDI") || n.includes("MEHANDI")) return "✿";
  if (n.includes("SANGEET")) return "♪";
  if (n.includes("RECEPTION")) return "✦";
  if (n.includes("WEDDING")) return "❦";
  if (n.includes("ENGAGE")) return "💍";
  return "◆";
}

function formatTeamSize(raw: string) {
  const t = raw.trim();
  if (!t) return "Dedicated team assigned";
  if (/photographer|filmmaker|member|team/i.test(t)) return t;
  return t;
}

export function LuxuryQuotationView({
  quotation,
  accepted,
  revisionSent,
  expired,
  canAct,
  actionBusy,
  onAcceptClick,
  onRequestRevision,
}: {
  quotation: Quotation;
  accepted: boolean;
  revisionSent: boolean;
  expired: boolean;
  canAct: boolean;
  actionBusy: boolean;
  onAcceptClick: () => void;
  onRequestRevision: () => void;
}) {
  const first = quotation.events[0];
  const dateLabel = first ? formatHeroDate(first.eventDate) : "";
  const location = (first?.venue || "Your celebration").toUpperCase();
  const names = quotation.clientName.toUpperCase();
  const dearName = quotation.clientName.includes("&")
    ? quotation.clientName
    : quotation.clientName;
  const notes = quotation.additionalNotes ? [quotation.additionalNotes] : PACKAGE_NOTES;

  const features = PACKAGE_FEATURES.filter(
    (f) => f !== "Engagement / Pre-Wedding Shoot" || quotation.includeEngagementPackage,
  );

  return (
    <div className="lq">
      <header className="lq-nav">
        <img src="/hswf_logo_white.png" alt="HSWF" className="lq-nav-logo" />
        <nav className="lq-nav-links">
          <a href="#welcome" onClick={(e) => { e.preventDefault(); scrollTo("welcome"); }}>Welcome</a>
          <a href="#films" onClick={(e) => { e.preventDefault(); scrollTo("films"); }}>Films</a>
          <a href="#coverage" onClick={(e) => { e.preventDefault(); scrollTo("coverage"); }}>Coverage</a>
          <a href="#investment" onClick={(e) => { e.preventDefault(); scrollTo("investment"); }}>Investment</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a>
          <a href="#connect" onClick={(e) => { e.preventDefault(); scrollTo("connect"); }}>Let&apos;s Connect</a>
        </nav>
        <button type="button" className="lq-nav-cta" onClick={onAcceptClick}>
          Reserve Your Date
        </button>
      </header>

      {/* Hero */}
      <section id="welcome" className="lq-hero">
        <div className="lq-hero-bg" style={{ backgroundImage: "url(/quotation/page-01-img-0.jpeg)" }} />
        <div className="lq-hero-overlay" />
        <div className="lq-hero-inner">
          <h1 className="lq-hero-names lq-serif">{names}</h1>
          {dateLabel ? <p className="lq-hero-date">{dateLabel} · {location}</p> : null}
          <p className="lq-hero-tag">A proposal crafted exclusively for your wedding.</p>
          <div className="lq-hero-actions">
            <button type="button" className="lq-btn-gold" onClick={() => scrollTo("films")}>View Films</button>
            <button type="button" className="lq-btn-outline" onClick={() => scrollTo("investment")}>
              Explore Proposal ↓
            </button>
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="lq-section lq-section-cream">
        <div className="lq-wrap lq-note-grid">
          <div>
            <p className="lq-note-dear lq-serif">Dear {dearName},</p>
            <p className="lq-note-body">
              Thank you for considering Harishankar Photography to document one of the most meaningful chapters of your life.
              This proposal has been prepared exclusively for you — with your events, team, and investment outlined clearly below.
              <br /><br />
              We believe the best wedding films are felt first and perfected later. If this resonates with you, we would be honoured to tell your story.
            </p>
            <p className="lq-note-sign">Harishankar</p>
            <p className="lq-note-role">Founder, HSWF</p>
          </div>
          <div
            className="lq-video-wrap"
            style={{ backgroundImage: "url(/quotation/page-02-img-0.jpeg)" }}
          >
            <div className="lq-video-play">
              <div className="lq-play-circle"><Play size={18} fill="white" stroke="none" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="lq-section">
        <div className="lq-wrap">
          <div className="lq-heading">
            <p className="lq-heading-eyebrow">What Makes HSWF Different</p>
          </div>
          <div className="lq-pillars">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="lq-pillar">
                <Icon size={22} strokeWidth={1.25} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Films */}
      <section id="films" className="lq-section">
        <div className="lq-wrap">
          <div className="lq-heading">
            <p className="lq-heading-eyebrow">Portfolio</p>
            <h2 className="lq-heading-title lq-serif">Stories We Love</h2>
          </div>
          <div className="lq-films">
            {FILMS.map((f) => (
              <div key={f.names} className="lq-film" style={{ backgroundImage: `url(${f.image})` }}>
                <div className="lq-film-play">
                  <div className="lq-play-circle"><Play size={16} fill="white" stroke="none" /></div>
                </div>
                <div className="lq-film-label">{f.names} · {f.place}</div>
              </div>
            ))}
          </div>
          <div className="lq-films-more">
            <button type="button" className="lq-btn-outline" onClick={() => scrollTo("investment")}>
              View More Films
            </button>
          </div>
        </div>
      </section>

      {/* Events — dynamic */}
      <section id="coverage" className="lq-section lq-section-cream">
        <div className="lq-wrap">
          <div className="lq-events-title">
            <p>Your Celebration</p>
            <h2 className="lq-serif">Events We&apos;ll Beautifully Capture</h2>
          </div>
          <div className="lq-timeline">
            {quotation.events.map((ev) => (
              <article key={ev.id} className="lq-event">
                <div className="lq-event-icon">{eventIcon(ev.eventName)}</div>
                <h3 className="lq-event-name">{ev.eventName}</h3>
                <p className="lq-event-team">
                  {formatTeamSize(ev.teamSize)}
                  {ev.duration ? <><br />{ev.duration}</> : null}
                </p>
              </article>
            ))}
          </div>
          <div className="lq-drone-note">
            <span>🛸</span> Drone Coverage Included
          </div>
        </div>
      </section>

      {/* Investment — dynamic */}
      <section id="investment" className="lq-section">
        <div className="lq-wrap">
          <div className="lq-heading">
            <p className="lq-heading-eyebrow">Investment</p>
            <h2 className="lq-heading-title lq-serif">Signature Story</h2>
          </div>
          <div className="lq-invest-grid">
            <div
              className="lq-album-shot"
              style={{ backgroundImage: "url(/quotation/page-07-img-0.png)" }}
              aria-hidden
            />
            <div className="lq-signature">
              <p className="lq-signature-label">Your Package</p>
              <div className="lq-checklist">
                {features.map((f) => (
                  <div key={f} className="lq-check">
                    <Check size={14} strokeWidth={2.5} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="lq-price-box">
                <span>Total Investment</span>
                <strong>{quotation.packageAmount}</strong>
              </div>
              <div className="lq-payments-inline">
                {quotation.bookingAmount ? (
                  <div className="lq-pay-row"><b>Booking Amount</b>{quotation.bookingAmount}</div>
                ) : null}
                {quotation.secondPayment ? (
                  <div className="lq-pay-row"><b>Second Payment</b>{quotation.secondPayment}</div>
                ) : null}
                {quotation.finalPayment ? (
                  <div className="lq-pay-row"><b>Final Payment</b>{quotation.finalPayment}</div>
                ) : null}
              </div>
              {quotation.includeEngagementPackage ? (
                <div className="lq-payments-inline" style={{ marginTop: "1rem" }}>
                  <div className="lq-pay-row"><b>Engagement Package</b>{quotation.engagementPackageAmount}</div>
                </div>
              ) : null}
              <p className="lq-invest-note">{notes[0]}</p>
            </div>
            <div className="lq-also">
              <h4>Also Available</h4>
              <div className="lq-tier">
                <p className="lq-tier-name">Essential Story</p>
                <p className="lq-tier-price">Custom quote</p>
              </div>
              <div className="lq-tier">
                <p className="lq-tier-name">Legacy Story</p>
                <p className="lq-tier-price">Custom quote</p>
              </div>
              <p className="lq-invest-note" style={{ marginTop: "1rem", textAlign: "center" }}>
                Proposal V{quotation.version}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lq-section lq-section-grey">
        <div className="lq-wrap">
          <div className="lq-heading">
            <p className="lq-heading-eyebrow">Love Notes</p>
            <h2 className="lq-heading-title lq-serif">From Our Couples</h2>
          </div>
          <div className="lq-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <blockquote key={t.name} className="lq-testimonial">
                <div
                  className="lq-testimonial-avatar"
                  style={{ backgroundImage: `url(${TESTIMONIAL_AVATARS[i] ?? TESTIMONIAL_AVATARS[0]})` }}
                />
                <div>
                  <q>{t.quote}</q>
                  <cite>{t.name}</cite>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lq-section">
        <div className="lq-wrap">
          <div className="lq-heading">
            <p className="lq-heading-eyebrow">Questions</p>
            <h2 className="lq-heading-title lq-serif">FAQ</h2>
          </div>
          <FaqList />
        </div>
      </section>

      {/* Closing */}
      <section id="connect" className="lq-closing">
        <div className="lq-closing-bg" style={{ backgroundImage: "url(/quotation/page-03-img-0.jpeg)" }} />
        <div className="lq-closing-overlay" />
        <div className="lq-closing-inner">
          <p className="lq-closing-names">{quotation.clientName}</p>
          <h2 className="lq-closing-title lq-serif">We Would Be Honoured To Tell Your Story</h2>
          <div style={{ marginTop: "1.75rem" }}>
            <button type="button" className="lq-btn-gold" onClick={onAcceptClick} disabled={!canAct || actionBusy}>
              Reserve Your Date
            </button>
          </div>
        </div>
      </section>

      <footer className="lq-footer-bar">
        <div className="lq-footer-grid">
          <img src="/hswf_logo_white.png" alt="HSWF" />
          <div className="lq-footer-social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">IG</a>
          </div>
          <div className="lq-footer-contact">
            +91 98765 43210
            <br />
            weddings@harishankar.com
            <br />
            www.harishankarphotography.com
          </div>
        </div>
      </footer>

      <footer className="lq-actions">
        <div className="lq-actions-inner">
          {accepted ? (
            <p className="lq-actions-msg">Thank you — we&apos;ll be in touch shortly.</p>
          ) : revisionSent ? (
            <p className="lq-actions-msg">Revision request sent. Our team will contact you.</p>
          ) : expired ? (
            <p className="lq-actions-msg">This proposal has expired. Contact us for an updated quote.</p>
          ) : (
            <>
              <button type="button" disabled={!canAct || actionBusy} onClick={onAcceptClick} className="lq-actions-accept">
                Accept Quotation
              </button>
              <button type="button" disabled={!canAct || actionBusy} onClick={onRequestRevision} className="lq-actions-revision">
                Request Revision
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function FaqList() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="lq-faq-grid">
      {FAQ.map((item, i) => (
        <div key={item.q} className="lq-faq-item">
          <button type="button" className="lq-faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <ChevronDown size={16} style={{ transform: open === i ? "rotate(180deg)" : undefined, transition: "0.2s" }} />
          </button>
          {open === i ? <p className="lq-faq-a">{item.a}</p> : null}
        </div>
      ))}
    </div>
  );
}
