# Mora

Personal daily-task reminder PWA. Expo Router (web) + Supabase + Web Push.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase + VAPID values.
3. Create a Supabase project and run `supabase/migrations/0001_init.sql`.
4. Generate VAPID keys: `npx web-push generate-vapid-keys`
5. Deploy the scheduler:
   ```
   supabase functions deploy tick --no-verify-jwt
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
   ```
6. Uncomment and run the `cron.schedule(...)` block at the bottom of the migration, filling in your project ref and service role key.
7. Add PNG icons to `public/`: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.

## Dev

```
npm run web
```

## Deploy (web)

```
npm run build:web
# then upload dist/ to Vercel, Netlify, or Cloudflare Pages
```

## iPhone install

1. Open the deployed HTTPS URL in Safari (iOS 16.4+).
2. Share → Add to Home Screen.
3. Open the installed app.
4. Tap **Enable notifications**.
5. Create a task. Lock your phone. Wait for the first ping.

## Notes

- Notifications come from the Supabase Edge Function running every minute.
- A task keeps notifying until you either tap the notification or check the circle in the app.
- All tasks are implicitly daily — completing one only clears it for today.
