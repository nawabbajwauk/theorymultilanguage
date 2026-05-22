# Build This As A Mobile App

This project can become a real mobile app without rewriting it. The app is built as a web app, then wrapped for Android/iPhone with Capacitor.

## 1. Install Requirements

On your Mac, install:

- Node.js LTS from `https://nodejs.org`
- Xcode from the Mac App Store for iPhone builds
- Android Studio from `https://developer.android.com/studio` for Android builds

## 2. Open Terminal In This Folder

```zsh
cd /Users/nawab/Documents/Codex/2026-05-16/make-a-website-on-uk-driving
```

## 3. Install The Mobile Build Tools

```zsh
npm install
```

## 4. Test The Web App

```zsh
npm run start
```

Open:

```text
http://127.0.0.1:4173/index.html
```

## 5. Create Android App

```zsh
npm run mobile:add:android
npm run mobile:sync
npm run mobile:open:android
```

Android Studio will open. From there you can run it on an emulator or plug in an Android phone.

## 6. Create iPhone App

```zsh
npm run mobile:add:ios
npm run mobile:sync
npm run mobile:open:ios
```

Xcode will open. You need an Apple Developer account to publish to the App Store.

## 7. After Every Website Change

Run:

```zsh
npm run mobile:sync
```

Then rebuild from Android Studio or Xcode.

## Free Learning, Ethical Money

Keep the app free for learners. Make money later with:

- Donations
- Local driving instructor sponsorships
- Optional instructor dashboard
- Printed revision packs
- Referral partnerships

Do not sell learner data. Keep the free access form opt-in only.
