import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const contactEmail = "hello@hswf.in";
const lastUpdated = "16 March 2026";

export function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      subtitle="How HSWF handles information in the web app and mobile app."
    >
      <p>
        Harishankar Photography (&quot;HSWF&quot;, &quot;we&quot;, &quot;us&quot;) operates the HSWF wedding
        production dashboard at <a href="https://hswf.app">hswf.app</a> and the HSWF mobile
        application. This policy explains what information we process when you use those products.
      </p>

      <h2>Who this applies to</h2>
      <p>
        HSWF is an internal studio operations tool for our team (admins, coordinators, and editors)
        and related workflows such as public enquiry and quotation links. It is not a consumer social
        network.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li>
          <strong>Account credentials</strong> — username and password for signed-in team members.
        </li>
        <li>
          <strong>Production data</strong> — shoot calendar entries, client/couple names, event
          details, venues, team assignments, deliverable tasks, leads, quotations, and career
          applications as entered by our staff or submitted through public forms.
        </li>
        <li>
          <strong>Usage needed to run the service</strong> — authentication session cookies or tokens,
          and standard server logs (for example IP address, timestamps, and error diagnostics) used
          for security and reliability.
        </li>
      </ul>
      <p>
        The mobile app does not request access to your camera, microphone, photos, contacts, or
        precise location.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To authenticate users and operate wedding production workflows</li>
        <li>To respond to enquiries and manage quotations</li>
        <li>To review career applications</li>
        <li>To keep the service secure and troubleshoot issues</li>
      </ul>
      <p>We do not sell personal information. We do not use advertising trackers in the HSWF app.</p>

      <h2>Sharing</h2>
      <p>
        We use infrastructure providers to host the application and database (for example cloud
        hosting). Those providers process data only to provide their services to us. We may disclose
        information if required by law.
      </p>

      <h2>Retention</h2>
      <p>
        Production and account data are kept for as long as needed to run studio operations, unless
        we delete them earlier at a client&apos;s or team member&apos;s request where applicable.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard protections such as encrypted connections (HTTPS) and access
        controls. No method of transmission or storage is 100% secure.
      </p>

      <h2>Children</h2>
      <p>HSWF is not directed at children under 13, and we do not knowingly collect data from them.</p>

      <h2>Your choices</h2>
      <p>
        Team members can ask us to update or remove their account. People who submitted an enquiry or
        career application can contact us to correct or delete that submission where appropriate.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy:{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
      <p>Last updated: {lastUpdated}</p>
    </LegalDoc>
  );
}

export function SupportPage() {
  return (
    <LegalDoc
      title="Support"
      subtitle="Help for the HSWF web dashboard and mobile app."
    >
      <p>
        HSWF is Harishankar Photography&apos;s wedding production workspace for studio staff and
        related public forms.
      </p>

      <h2>Contact</h2>
      <p>
        Email support: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
      <p>We typically respond within 1–2 business days.</p>

      <h2>Common requests</h2>
      <ul>
        <li>Login or password help for team accounts</li>
        <li>Access for a new team member</li>
        <li>Questions about the Careers / Join Us form</li>
        <li>App Store or TestFlight install issues</li>
      </ul>

      <h2>Related links</h2>
      <ul>
        <li>
          <Link to="/privacy">Privacy Policy</Link>
        </li>
        <li>
          <Link to="/terms">Terms of Use</Link>
        </li>
        <li>
          <Link to="/join">Join Us</Link>
        </li>
        <li>
          <a href="https://hswf.app/login">Sign in</a>
        </li>
      </ul>
    </LegalDoc>
  );
}

export function TermsOfUsePage() {
  return (
    <LegalDoc
      title="Terms of Use"
      subtitle="Rules for using the HSWF web and mobile products."
    >
      <p>
        By accessing HSWF (web or mobile), you agree to these terms. If you do not agree, do not use
        the service.
      </p>

      <h2>The service</h2>
      <p>
        HSWF is a wedding production operations tool provided by Harishankar Photography for
        authorized studio staff and related public forms (enquiry, quotations, careers). Features may
        change as we improve the product.
      </p>

      <h2>Accounts</h2>
      <p>
        You must keep login credentials confidential and use only the access we grant you. You are
        responsible for activity under your account. Notify us promptly if you suspect unauthorized
        use.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use HSWF only for legitimate studio work and authorized submissions</li>
        <li>Do not attempt to access other users&apos; data without permission</li>
        <li>Do not disrupt, reverse engineer, or abuse the service</li>
        <li>Do not upload unlawful or harmful content</li>
      </ul>

      <h2>Client and production data</h2>
      <p>
        Staff must handle client and wedding data carefully and only as needed for production work.
        Public form submitters confirm the information they provide is accurate to the best of their
        knowledge.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The HSWF software, branding, and related materials belong to Harishankar Photography or its
        licensors. You receive a limited right to use the service — not ownership of the software.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of uninterrupted availability.
        To the fullest extent permitted by law, we are not liable for indirect or consequential
        damages arising from use of HSWF.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes means you accept the updated terms.
        The date at the bottom of this page will be revised when we do.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
      <p>Last updated: {lastUpdated}</p>
    </LegalDoc>
  );
}

function LegalDoc({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
          <Link to="/login" className="text-sm font-semibold tracking-wide text-zinc-900">
            HSWF
          </Link>
          <nav className="flex gap-4 text-sm text-zinc-600">
            <Link to="/privacy" className="hover:text-zinc-900">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-zinc-900">
              Terms
            </Link>
            <Link to="/support" className="hover:text-zinc-900">
              Support
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
        <article className="prose prose-zinc mt-8 max-w-none text-[15px] leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_a]:text-violet-700 [&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
          {children}
        </article>
      </main>
      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Harishankar Photography · HSWF
      </footer>
    </div>
  );
}
