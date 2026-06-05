import { EVENTS_FOOTNOTE } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return { day, month };
}

export function EventsBrochurePage({ quotation }: { quotation: Quotation }) {
  return (
    <section className="quotation-brochure-page">
      <div className="quotation-brochure-dynamic qb-events">
        <header className="qb-events-header">
          <h2>Upcoming Events</h2>
          <p>For: {quotation.clientName}</p>
        </header>

        <div className="qb-events-grid">
          {quotation.events.map((ev, i) => {
            const { day, month } = formatEventDate(ev.eventDate);
            const tone = i % 2 === 0 ? "tan" : "beige";
            return (
              <article key={ev.id} className={`qb-event-card ${tone}`}>
                <div className="qb-event-date">
                  <span className="qb-event-month">{month}</span>
                  <span className="qb-event-day">{day}</span>
                </div>
                <div className="qb-event-details">
                  <div className="qb-event-name">{ev.eventName}</div>
                  <div className="qb-event-meta">
                    {ev.teamSize ? <div>{ev.teamSize}</div> : null}
                    {ev.duration ? <div>{ev.duration}</div> : null}
                    {ev.venue ? <div>{ev.venue}</div> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="qb-events-footnote">
          <p>{EVENTS_FOOTNOTE}</p>
        </footer>
      </div>
    </section>
  );
}
