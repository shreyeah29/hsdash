import { QUOTATION_PAGES } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return { day, month };
}

/** PDF checkerboard: tan left / beige right, then swap on the next row. */
function cardTone(index: number) {
  const row = Math.floor(index / 2);
  const col = index % 2;
  return (row + col) % 2 === 0 ? "tan" : "beige";
}

export function EventsBrochurePage({ quotation }: { quotation: Quotation }) {
  const sparse = quotation.events.length <= 2;

  return (
    <section className="quotation-brochure-page">
      <div className="quotation-brochure-dynamic qb-events-page">
        <img src={QUOTATION_PAGES.events} alt="" className="qb-pdf-bg" aria-hidden />
        {/* Hides sample client + events baked into the PDF; title + footnote stay visible. */}
        <div className="qb-events-content-mask" aria-hidden />

        <div className="qb-events-overlay">
          <header className="qb-events-header">
            <p>For: {quotation.clientName}</p>
          </header>

          <div className="qb-events-body">
            <div className={`qb-events-grid${sparse ? " qb-events-grid--sparse" : ""}`}>
              {quotation.events.map((ev, i) => {
                const { day, month } = formatEventDate(ev.eventDate);
                return (
                  <article key={ev.id} className={`qb-event-card ${cardTone(i)}`}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
