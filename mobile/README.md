# HS Dash — Flutter mobile app

Android + iOS app using the same backend as the web dashboard.

**API reference:** see [`../API.md`](../API.md) in the repo root.

---

## 1. What to install (macOS — you need a Mac for iOS)

### Required for everyone

| Tool | Download | Purpose |
|------|----------|---------|
| **Flutter SDK** | https://docs.flutter.dev/get-started/install/macos | Builds Android + iOS |
| **Android Studio** | https://developer.android.com/studio | Android SDK + emulator |
| **Xcode** | Mac App Store | iOS simulator + App Store builds |
| **CocoaPods** | `sudo gem install cocoapods` | iOS native dependencies |
| **VS Code or Android Studio** | Either IDE | Flutter plugin / Dart support |

### Verify install

```bash
flutter doctor
```

Fix every item marked ✗ before continuing. Typical fixes:

```bash
# Accept Android licenses
flutter doctor --android-licenses

# Xcode command-line tools
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch

# CocoaPods (iOS)
cd mobile/ios && pod install && cd ../..
```

---

## 2. Project location

```text
hsdash/
  backend/     ← API (Render)
  frontend/    ← Web (Vercel)
  mobile/      ← This Flutter app
  API.md       ← All REST endpoints
```

---

## 3. Configure API URL

Production backend (example — use your Render URL):

```text
https://hsdash.onrender.com
```

### Option A — compile-time (simple)

Edit `lib/config/env.dart` (create when you wire the app):

```dart
const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://hsdash.onrender.com',
);
```

Run with:

```bash
flutter run --dart-define=API_URL=https://hsdash.onrender.com
```

### Option B — local backend

```bash
# Terminal 1 — backend
cd ../backend && npm run dev

# Terminal 2 — Android emulator uses 10.0.2.2 for host machine
flutter run --dart-define=API_URL=http://10.0.2.2:4000

# iOS simulator can use localhost
flutter run --dart-define=API_URL=http://localhost:4000
```

---

## 4. Run on emulators

### List devices

```bash
cd mobile
flutter devices
```

### Android emulator

1. Open **Android Studio** → **Device Manager** → **Create Device**
2. Pick a phone (e.g. Pixel 7) → system image (API 34+ recommended) → Finish
3. Start the emulator from Device Manager
4. Run:

```bash
cd mobile
flutter run
```

Or pick a device:

```bash
flutter run -d emulator-5554
```

### iOS simulator (Mac only)

1. Open **Xcode** once and accept license
2. Start simulator:

```bash
open -a Simulator
```

3. Run:

```bash
cd mobile
flutter run -d "iPhone 16"
```

### Physical phone

**Android:** Enable Developer options → USB debugging → plug in → `flutter devices` → `flutter run`

**iPhone:** Xcode → open `mobile/ios/Runner.xcworkspace` → select your Apple ID under Signing → trust device on phone → `flutter run`

---

## 5. Recommended Flutter packages

Add when you start building screens:

```bash
cd mobile
flutter pub add dio flutter_secure_storage go_router flutter_riverpod intl
flutter pub add socket_io_client   # realtime (optional)
```

| Package | Use |
|---------|-----|
| `dio` | HTTP client → `Authorization: Bearer` |
| `flutter_secure_storage` | Save JWT safely |
| `go_router` | Admin / coordinator / editor routes |
| `flutter_riverpod` | App state |
| `socket_io_client` | Live task updates (see API.md) |

---

## 6. App structure (suggested)

Match the web roles:

```text
lib/
  config/env.dart
  core/api_client.dart       # Dio + token interceptor
  core/auth_repository.dart  # login, logout, /auth/me
  models/                    # User, Task, ShootCalendarEntry
  features/
    auth/login_screen.dart
    admin/overview_screen.dart
    admin/calendar_screen.dart
    editor/tasks_screen.dart
  app.dart                   # MaterialApp + router
  main.dart
```

### Auth flow (same as web)

1. `POST /auth/login` with email + password
2. Store `accessToken` in secure storage
3. Attach header: `Authorization: Bearer <token>`
4. On launch: `GET /auth/me` if token exists
5. Route by `user.role`: `ADMIN` | `COORDINATOR` | `EDITOR`

Full endpoint list: [`../API.md`](../API.md).

### Design (match web)

- Primary: violet `#7c3aed`, cyan accents, white cards, soft borders
- Font: `google_fonts` → Inter or similar (web uses Geist)
- Rounded cards (16px), stat chips, calendar grid like admin overview

---

## 7. Day-to-day commands

```bash
cd mobile

flutter pub get          # after changing pubspec.yaml
flutter analyze          # lint
flutter test             # unit tests
flutter run              # debug on connected device
flutter run --release    # release mode (faster, no debug banner)

# Hot reload: press `r` in terminal while app is running
# Hot restart: press `R`
# Quit: `q`
```

---

## 8. Build release binaries

### Android (Google Play)

```bash
cd mobile

# Create upload keystore (once — keep file + passwords safe!)
keytool -genkey -v -keystore ~/hsdash-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias hsdash

# Configure signing: android/key.properties + android/app/build.gradle.kts
# See: https://docs.flutter.dev/deployment/android

flutter build appbundle --release --dart-define=API_URL=https://hsdash.onrender.com
```

Output: `build/app/outputs/bundle/release/app-release.aab` → upload to Play Console.

### iOS (App Store)

```bash
cd mobile
flutter build ipa --release --dart-define=API_URL=https://hsdash.onrender.com
```

Or open Xcode → **Product → Archive** → **Distribute App** → App Store Connect.

Requires **Apple Developer Program** ($99/year).

---

## 9. Store publishing checklist

### Both stores

- [ ] App name: **HS Dash** (or your brand)
- [ ] Privacy policy URL (required — host a simple page)
- [ ] App icon 1024×1024
- [ ] Screenshots (phone + tablet sizes)
- [ ] Short + long description
- [ ] Support email

### Google Play

1. Create account: https://play.google.com/console — **$25 one-time**
2. Create app → Production track
3. Upload **AAB** (not APK for new apps)
4. Complete: content rating questionnaire, data safety form, target audience
5. Internal testing → closed testing → production

Typical review: hours to a few days.

### Apple App Store

1. Enroll: https://developer.apple.com — **$99/year**
2. App Store Connect → create app, bundle ID `com.hsdash.hsdash_mobile`
3. Upload build via Xcode or Transporter
4. TestFlight for beta testers first
5. Submit for review (privacy, login demo account if needed)

Typical review: 1–3 days.

### Backend note for mobile

Ensure Render `FRONTEND_URL` / CORS allows your app if you use cookies. **Mobile should use Bearer token only** — already supported by the API (see API.md).

---

## 10. Suggested build order

1. **Week 1:** Login + role routing + secure token storage
2. **Week 2:** Admin overview calendar (today panel + month grid) — `GET /admin/overview`
3. **Week 3:** Editor tasks list + status updates — `GET /tasks`, `PUT /tasks/:id/status`
4. **Week 4:** Coordinator calendar read + assign — production calendar APIs
5. **Week 5:** Notifications + socket refresh
6. **Week 6:** Polish, icons, store assets, TestFlight / internal testing

---

## 11. Troubleshooting

| Problem | Fix |
|---------|-----|
| `CocoaPods not installed` | `sudo gem install cocoapods` then `cd ios && pod install` |
| Android licenses | `flutter doctor --android-licenses` |
| iOS signing error | Open `ios/Runner.xcworkspace` in Xcode → Signing & Capabilities → Team |
| API network error on Android emulator | Use `10.0.2.2:4000` not `localhost` |
| API network error on iOS sim | `localhost:4000` works |
| Render cold start | First request may take ~30s; show loading state |

---

## Quick start (Step 1 — API + login done)

```bash
cd mobile
flutter pub get

# Production API (Render)
flutter run --dart-define=API_URL=https://hsdash.onrender.com

# iOS simulator
open -a Simulator
flutter run -d "iPhone 16" --dart-define=API_URL=https://hsdash.onrender.com

# Android emulator (start from Android Studio Device Manager first)
flutter run -d emulator-5554 --dart-define=API_URL=https://hsdash.onrender.com
```

Sign in with the same email/password as the web app. After login:
- **Admin** → overview with live stats from `GET /admin/overview`
- **Coordinator / Editor** → open tasks from `GET /tasks`

### What's implemented

| Feature | API | Screen |
|---------|-----|--------|
| Login + session | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | Login |
| Admin today view | `GET /admin/overview` | Admin → Today tab |
| Admin calendar | `GET /admin/overview` (tasks by deadline) | Admin → Calendar tab |
| Staff tasks + filters | `GET /tasks` | Staff → Tasks tab |
| Start / Mark done | `PUT /tasks/:id/status` | Staff → Tasks (Open filter) |
| Notifications | `GET /notifications`, `PATCH .../read`, `POST /read-all` | Staff → Alerts tab |

### Project layout

```text
mobile/lib/
  config/                  # theme, API_URL
  core/                    # api_client, app_repository, calendar_utils
  models/                  # user, task, notification
  features/auth/           # login, providers
  features/admin/          # admin shell (today + calendar)
  features/staff/          # staff shell (tasks + alerts)
  widgets/                 # calendar, task cards
  app.dart                 # router
  main.dart
```

---

## Quick start (legacy counter removed)
