# UK Theory Test Trainer Launch Plan

## Product Position

Keep the education free. The app can still earn money through optional support:

- Free learner access with opt-in contact record.
- Donations or "support this free app" payments.
- Ethical sponsorships from driving instructors or local schools.
- Paid B2B dashboard later for instructors, while learner practice stays free.
- Optional printed revision pack later, not required to learn.

## Fastest Launch

1. Create a free GitHub account and put this folder in a repository.
2. Deploy on Netlify.
3. Netlify should detect the `free-access` form in `index.html` and store submissions.
4. Buy a simple domain, for example `theorytesttrainer.co.uk`, and connect it to Netlify.
5. Test on phone, then ask 10 learners to register and try one mock test.

## Mobile App Path

Start with the PWA already added here:

- `manifest.webmanifest` makes it installable.
- `sw.js` caches the app for offline use.
- The `Install app` button uses the browser install prompt when available.

After people use it, wrap the same website as an app:

- Android: use Trusted Web Activity or Capacitor.
- iPhone: keep PWA first, then consider App Store only if users ask.

## Records And Privacy

The current form records free access locally during development. On Netlify, the same form can collect submissions in your Netlify dashboard.

Keep it simple and respectful:

- Ask only for name and email/phone.
- Explain that education is free.
- Ask for consent before contacting learners.
- Add a Privacy Policy page before public marketing.
- Do not sell learner data.

## Marketing

Start narrow:

- TikTok/Reels: 30-second road sign quizzes in English, Punjabi and Hindi.
- WhatsApp groups: share the free mock test link.
- Local driving instructors: offer a free link for their students.
- Google Business/local pages: target "Punjabi driving theory test UK" and "Hindi driving theory test UK".
- Flyers at community shops with a QR code.

## Next Build Priorities

1. Add a Privacy Policy page.
2. Add real analytics with privacy-friendly tools.
3. Add instructor/school referral codes.
4. Add more hazard-perception style visual scenarios.
5. Add admin dashboard after the first real users appear.
