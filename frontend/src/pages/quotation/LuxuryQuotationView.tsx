import { useState } from "react";
import { DELIVERABLES, PACKAGE_NOTES, TESTIMONIALS } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";
import "./luxury-quotation.css";

const PILLARS = [
  { icon: "✦", title: "Story First", body: "Every frame is crafted to feel like your story—not a template." },
  { icon: "◈", title: "Dedicated Team", body: "Lead photographers and filmmakers assigned to your celebration." },
  { icon: "❋", title: "Natural Emotions", body: "Unposed, honest moments captured with quiet presence." },
  { icon: "◎", title: "Fast & Reliable", body: "Clear timelines, consistent delivery, and proactive communication." },
  { icon: "✧", title: "Cinematic Editing", body: "Films shaped with film-industry sensibility and emotional pacing." },
];

const FILMS = [
  { label: "Kiran & Samhitha · Hyderabad", image: "/quotation/page-09-img-0.jpeg" },
  { label: "Taruni & Anudeep · Bengaluru", image: "/quotation/page-09-img-2.jpeg" },
  { label: "Spoorthy & Vajrang · Vizag", image: "/quotation/page-09-img-3.png" },
  { label: "Featured Film · Harishankar", image: "/quotation/page-05-img-0.jpeg" },
];

const FAQ = [
  {
    q: "Do you travel for weddings?",
    a: "Yes. We cover celebrations across India and internationally. Travel and stay for the team are arranged by the client for out-of-city events.",
  },
  {
    q: "How many photographers will be present?",
    a: "Team size is listed per event in your proposal. It typically includes lead photographer, candid, traditional, and videography coverage.",
  },
  {
    q: "When will we receive photos and films?",
    a: "A glimpse within 7–10 days per event. Full curated galleries and films within 100 days from your last event, as outlined in deliverables.",
  },
  {
    q: "Can we request changes to this proposal?",
    a: "Absolutely. Use Request Revision below and our team will prepare an updated version tailored to your needs.",
  },
  {
    q: "What are your payment terms?",
    a: "Booking advance secures your dates. Subsequent payments are scheduled before key milestones as listed in the Investment section.",
  },
  {
    q: "Is drone coverage included?",
    a: "Drone coverage may be included or billed as per add-ons depending on your package. Details are confirmed before booking.",
  },
];

function formatHeroMeta(quotation: Quotation) {
  const first = quotation.events[0];
  const date = first ? new Date(first.eventDate) : null;
  const dateLabel = date
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : "";
  const location = first?.venue?.trim() || "Your celebration";
  return { dateLabel, location };
}

function eventIcon(name: string) {
  const n = name.toUpperCase();
  if (n.includes("HALDI")) return "🌼";
  if (n.includes("MEHENDI") || n.includes("MEHANDI")) return "✿";
  if (n.includes("SANGEET")) return "♪";
  if (n.includes("RECEPTION")) return "✦";
  if (n.includes("ENGAGE")) return "💍";
  return "❦";
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const { dateLabel, location } = formatHeroMeta(quotation);
  const notes = quotation.additionalNotes ? [quotation.additionalNotes] : PACKAGE_NOTES;
  const names = quotation.clientName.toUpperCase();

  return (
    <div className="lq">
      <header className="lq-nav">
        <img src="/hswf_logo_white.png" alt="Harishankar Photography" />
        <nav className="lq-nav-links">
          <a href="#welcome" onClick={(e) => { e.preventDefault(); scrollTo("welcome"); }}>Welcome</a>
          <a href="#films" onClick={(e) => { e.preventDefault(); scrollTo("films"); }}>Films</a>
          <a href="#coverage" onClick={(e) => { e.preventDefault(); scrollTo("coverage"); }}>Coverage</a>
          <a href="#investment" onClick={(e) => { e.preventDefault(); scrollTo("investment"); }}>Investment</a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a>
        </nav>
        <button type="button" className="lq-nav-cta" onClick={() => scrollTo("investment")}>
          View Proposal
        </button>
      </header>

      <section id="welcome" className="lq-hero">
        <div className="lq-hero-bg" style={{ backgroundImage: "url(/quotation/page-01-img-0.jpeg)" }} />
        <div className="lq-hero-overlay" />
        <div className="lq-hero-content">
          <p className="lq-hero-meta">Harishankar Photography · Proposal V{quotation.version}</p>
          <h1 className="lq-hero-names lq-serif">{names}</h1>
          {dateLabel ? <p className="lq-hero-meta">{dateLabel} · {location}</p> : null}
          <p className="lq-hero-tag">A proposal crafted exclusively for your wedding.</p>
          <div className="lq-hero-actions">
            <button type="button" className="lq-btn-gold" onClick={() => scrollTo("films")}>View Films</button>
            <button type="button" className="lq-btn-outline" onClick={() => scrollTo("investment")}>Explore Proposal ↓</button>
          </div>
        </div>
      </section>

      <section className="lq-section lq-section-cream">
        <p className="lq-section-sub">A Note From</p>
        <h2 className="lq-section-title lq-serif">Harishankar</h2>
        <div className="lq-note-grid">
          <div>
            <p className="lq-note-text">
              Dear {quotation.clientName.split("&")[0]?.trim() || quotation.clientName},
              <br /><br />
              Thank you for considering us to document one of the most meaningful chapters of your life.
              This proposal is prepared exclusively for you—with your events, your team size, and your investment outlined clearly.
              <br /><br />
              We believe the best wedding films are felt first and perfected later. If this resonates with you, we would be honoured to tell your story.
            </p>
            <p className="lq-note-sign">— Harish & Shankar</p>
          </div>
          <div
            className="lq-video-thumb"
            style={{ backgroundImage: "url(/quotation/page-02-img-0.jpeg)" }}
          >
            <div className="lq-video-play"><span>▶</span></div>
          </div>
        </div>
      </section>

      <section className="lq-section">
        <p className="lq-section-sub">What Makes Us Different</p>
        <h2 className="lq-section-title lq-serif">The Harishankar Way</h2>
        <div className="lq-pillars">
          {PILLARS.map((p) => (
            <article key={p.title}>
              <div className="lq-pillar-icon">{p.icon}</div>
              <h3 className="lq-pillar-title">{p.title}</h3>
              <p className="lq-pillar-body">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="films" className="lq-section">
        <p className="lq-section-sub">Stories We Love</p>
        <h2 className="lq-section-title lq-serif">Films & Moments</h2>
        <div className="lq-films-grid">
          {FILMS.map((f) => (
            <div key={f.label} className="lq-film-card" style={{ backgroundImage: `url(${f.image})` }}>
              <div className="lq-film-label">{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="coverage" className="lq-section lq-section-cream">
        <p className="lq-section-sub">Your Celebration</p>
        <h2 className="lq-section-title lq-serif">Events We&apos;ll Beautifully Capture</h2>
        <div className="lq-events-wrap">
          <div className="lq-events-track">
            {quotation.events.map((ev) => (
              <article key={ev.id} className="lq-event-node">
                <div className="lq-event-icon">{eventIcon(ev.eventName)}</div>
                <h3 className="lq-event-name">{ev.eventName}</h3>
                <div className="lq-event-meta">
                  {ev.teamSize ? <div>{ev.teamSize}</div> : null}
                  {ev.duration ? <div>{ev.duration}</div> : null}
                  {ev.venue ? <div>{ev.venue}</div> : null}
                </div>
              </article>
            ))}
          </div>
          <p className="lq-events-foot">Drone coverage available · Team details per event above</p>
        </div>
      </section>

      <section id="investment" className="lq-section">
        <p className="lq-section-sub">Investment</p>
        <h2 className="lq-section-title lq-serif">Signature Story</h2>
        <div className="lq-investment">
          <div className="lq-investment-card">
            <p className="lq-package-label">Your Package</p>
            <p className="lq-package-price lq-serif">{quotation.packageAmount}</p>
            <div className="lq-deliverables">
              {DELIVERABLES.slice(0, 6).map((d) => (
                <div key={d.title} className="lq-deliverable">
                  <mark>✓</mark>
                  <span><strong>{d.title}</strong> — {d.body}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lq-investment-card">
            <p className="lq-package-label">Payment Schedule</p>
            <div className="lq-payments">
              {quotation.bookingAmount ? (
                <div className="lq-payment-row">
                  <h4>Booking Amount</h4>
                  <p>{quotation.bookingAmount}</p>
                </div>
              ) : null}
              {quotation.secondPayment ? (
                <div className="lq-payment-row">
                  <h4>Second Payment</h4>
                  <p>{quotation.secondPayment}</p>
                </div>
              ) : null}
              {quotation.finalPayment ? (
                <div className="lq-payment-row">
                  <h4>Final Payment</h4>
                  <p>{quotation.finalPayment}</p>
                </div>
              ) : null}
            </div>
            {quotation.includeEngagementPackage ? (
              <div className="lq-payments" style={{ marginTop: "1.25rem" }}>
                <p className="lq-package-label">Engagement Package</p>
                <p className="lq-package-price lq-serif" style={{ fontSize: "1.4rem" }}>{quotation.engagementPackageAmount}</p>
                {quotation.engagementBookingAmount ? (
                  <div className="lq-payment-row"><h4>Booking</h4><p>{quotation.engagementBookingAmount}</p></div>
                ) : null}
                {quotation.engagementFinalPayment ? (
                  <div className="lq-payment-row"><h4>Final</h4><p>{quotation.engagementFinalPayment}</p></div>
                ) : null}
              </div>
            ) : null}
            <div className="lq-notes-box">
              <p className="lq-package-label">Note</p>
              <ul>
                {notes.map((n) => <li key={n.slice(0, 40)}>{n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lq-section">
        <p className="lq-section-sub">Love Notes</p>
        <h2 className="lq-section-title lq-serif">From Our Couples</h2>
        <div className="lq-testimonials">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="lq-testimonial">
              <p>&ldquo;{t.quote}&rdquo;</p>
              <cite>{t.name}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="faq" className="lq-section">
        <p className="lq-section-sub">FAQ</p>
        <h2 className="lq-section-title lq-serif">Common Questions</h2>
        <FaqList />
      </section>

      <section id="connect" className="lq-closing">
        <div className="lq-closing-bg" style={{ backgroundImage: "url(/quotation/page-03-img-0.jpeg)" }} />
        <div className="lq-closing-overlay" />
        <div className="lq-closing-content">
          <p className="lq-section-sub" style={{ marginBottom: "0.75rem" }}>{quotation.clientName}</p>
          <h2 className="lq-section-title lq-serif">We Would Be Honoured To Tell Your Story</h2>
          <div style={{ marginTop: "1.75rem" }}>
            <button type="button" className="lq-btn-gold" onClick={onAcceptClick} disabled={!canAct || actionBusy}>
              Accept Proposal
            </button>
          </div>
        </div>
      </section>

      <footer className="lq-footer">
        <img src="/hswf_logo_white.png" alt="Harishankar Photography" />
        <p>
          Harishankar Photography · Estd. 2012
          <br />
          weddings@harishankar.com · +91 98765 43210
          <br />
          www.harishankarphotography.com
        </p>
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
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="lq-faq-grid">
      {FAQ.map((item, i) => (
        <div key={item.q} className="lq-faq-item">
          <button type="button" className="lq-faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <span>{open === i ? "−" : "+"}</span>
          </button>
          {open === i ? <p className="lq-faq-a">{item.a}</p> : null}
        </div>
      ))}
    </div>
  );
}
