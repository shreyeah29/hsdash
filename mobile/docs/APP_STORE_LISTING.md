# App Store Connect listing — HSWF

Use these values when submitting **HSWF** for App Store review.

## App identity

| Field | Value |
|-------|--------|
| Name | HSWF |
| Subtitle | Wedding production workspace |
| Bundle ID | `com.hsdash.hsdashMobile` |
| SKU | `hswf-ios` (any unique SKU is fine) |
| Primary category | Business |
| Secondary category | Productivity (optional) |
| Version | Match `pubspec.yaml` (currently **1.0.2**) |

## URLs

| Field | Value |
|-------|--------|
| Privacy Policy URL | https://hswf.app/privacy |
| Support URL | https://hswf.app/support |
| Marketing URL (optional) | https://hswf.app |
| Copyright | © Harishankar Photography |

## Promotional text (optional, updatable anytime)

```
HSWF keeps wedding shoots, deliverables, and the studio team in one place — calendar, tasks, leads, and careers.
```

## Description

```
HSWF is Harishankar Photography’s wedding production workspace for studio staff.

Admins plan shoots, manage leads and quotations, track deliverables, browse the wedding archive, and review career applications.

Coordinators and editors see today’s work, update task status, and stay aligned with the studio calendar.

Sign-in is for authorized HSWF team members only. Public Join Us and enquiry forms are available on the web for applicants and clients.
```

## Keywords (100 characters max, comma-separated)

```
wedding,photography,production,studio,calendar,deliverables,tasks,team,HSWF
```

## What’s New (1.0.2)

```
• Branded launch screen
• Support page for App Store listing
• Careers Join Us link in the inbox
• Privacy and Terms links in the app
```

## Age rating

Complete Apple’s questionnaire. Suggested answers for this internal ops app:

- No unrestricted web browsing
- No gambling / contests
- No mature / sexual content
- No frequent realistic violence
- Medical / alcohol / etc.: None

Likely result: **4+**

## App Privacy (nutrition labels)

HSWF does **not** track users for advertising.

Data linked to the user (account / studio work), collected to operate the product:

- Contact Info — name, email, phone (account + career/lead forms)
- User Content — shoot notes, task updates, portfolio links as entered by users
- Identifiers — account user ID
- Diagnostics — crash / server logs as needed for reliability

Data is used for **App Functionality** (and optionally **Analytics** only if you enable crash tools later).

Do **not** claim tracking unless you add ads/analytics SDKs.

## Review notes (App Review Information)

Provide a **demo team login** Apple can use:

```
Username: <reviewer account>
Password: <temporary password>
```

Notes for reviewers:

```
HSWF is a private studio operations app. Public Join Us is at https://hswf.app/join. Privacy: https://hswf.app/privacy. Support: https://hswf.app/support. Use the demo account above to sign in as Admin.
```

Contact email: hello@hswf.in

## Screenshots (you must capture these)

Required for iPhone (at least one size set):

1. Login / brand screen
2. Admin home / calendar
3. Shoot detail or deadlines
4. Team / Careers inbox
5. Editor or coordinator work view (optional but strong)

Use an iPhone 6.7" simulator/device for the primary set. iPad screenshots optional if you keep iPad support.

## Upload build

IPA path after local build:

`mobile/build/ios/ipa/hsdash_mobile.ipa`

Upload with **Transporter** or Xcode Organizer → Distribute App.
