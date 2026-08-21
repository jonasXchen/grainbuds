# Grainbuds — Matcha & Asian Café

A calm, animated website for Grainbuds (Universitätsstraße 7, Erlangen) with an
online shop, pickup ordering, and an admin panel where the owner manages
products without touching code. Fully bilingual — English and German, with a
language toggle in the header. Prices are in EUR.

The menu, photos, address, opening hours, and contact details come from the
previous website (grainbudsasiancafe.com).

**Stack:** Next.js (App Router) · Supabase (database, auth, image storage) · Tailwind CSS v4 · Framer Motion · Lenis smooth scrolling

## Quick preview (no setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase configured, the site runs in
**demo mode**: the shop shows a built-in sample menu and checkout simulates an
order. The admin panel needs Supabase (next section).

## Connect Supabase (one-time, ~10 minutes)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Create the tables**: in the Supabase dashboard, open **SQL Editor → New query**,
   paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

   *Ran an older version before and getting "already exists" errors?* Run
   [`supabase/reset.sql`](supabase/reset.sql) first — it drops all
   `grainbuds_*` tables (and their data) so schema.sql installs cleanly.
   It touches nothing outside this project's objects.
3. **Load the real menu**: run [`supabase/seed.sql`](supabase/seed.sql) the same
   way — it contains the full Grainbuds menu (EN + DE, EUR prices, photos from
   the old site). Everything can be edited later in the admin panel, and
   re-running it refreshes names/prices without duplicating.

4. **Create the owner's login**: dashboard → **Authentication → Users →
   Add user → Create new user**. Enter the owner's email and a password, and tick
   **Auto confirm user**. Then register that account as Grainbuds staff —
   back in the SQL Editor, run (with the right email):

   ```sql
   insert into grainbuds_staff (user_id, email)
   select id, email from auth.users where email = 'owner@grainbuds.cafe'
   on conflict (user_id) do nothing;
   ```

   Both steps are required: a Supabase login alone is *not* enough — only
   accounts in `grainbuds_staff` can manage the café. This keeps users of any
   other app sharing the same Supabase project away from `grainbuds_*` tables.
   To revoke access later, delete the row (`delete from grainbuds_staff where
   email = '...'`).
5. **Add the keys to the site**: copy `.env.example` to `.env.local` and fill in
   the two values from **Project Settings → API Keys**: the Project URL and the
   **publishable** key (`sb_publishable_...`). The **secret** key is not needed —
   the site never uses it, so leave it where it is. (Older projects that only
   have a legacy `anon` key can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead;
   both are supported.)
6. Restart `npm run dev`. The shop now reads from your database, orders are
   saved, and `/admin/login` works.

## For the owner — day-to-day use (no coding)

- Go to **yoursite.com/admin** and sign in (also linked as "Staff login" in the site footer).
- **Staff mode on the shop** — while logged in, browsing the normal shop page
  shows your products with inline controls: an *Edit* button, a *Live/Hidden*
  toggle, and a stock stepper directly on each card. Hidden products appear
  with a "Hidden" overlay (customers never see them), and a floating
  *Staff mode* pill links back to the admin panel.
- **Products** — add, edit, hide, or delete anything on the menu:
  - Names and descriptions have an English and an optional German field — if
    the German one is empty, the English text is shown in both languages.
  - *Show in shop* hides an item without deleting it (e.g. sold out today).
  - *House favorite* features it on the home page.
  - Upload a photo, or leave it empty for an automatic on-brand illustration.
  - Manage categories at the bottom of the Products page.
- **Orders** — new online orders appear here, newest first. Move them through
  *New → In progress → Ready for pickup → Completed* as you work. Customers pay
  in store at pickup — record it on the order (*Paid · cash* / *Paid · card*),
  which stamps the payment time so you have a full payment history.
- **Inventory** — give a product a stock number and it counts down with every
  order; at 0 the shop shows "Sold out" automatically. Adjust stock with the
  +/− stepper right in the product list. Leave stock empty for made-to-order
  items that never run out.
- **Analytics** — orders, revenue, and average order value for the last 30
  days, revenue per day, your most-ordered products, and revenue by category.
- **Customers** — everyone who ordered, plus the mailing list. Customers join
  the list by ticking the opt-in box at checkout (required under GDPR — never
  email people who didn't opt in). Write a subject and message and send a
  product-launch update to the whole list, or use *Copy all emails* to BCC
  them from your own mail program.

Changes go live on the website within about a minute.

## Deploying

The easiest path is [Vercel](https://vercel.com): import the repo, set the two
environment variables from `.env.local`, deploy. Any Node host works
(`npm run build && npm start`).

## Project layout

```
src/
  app/(site)/        # public site: home, shop, product, checkout, order confirmation
  app/admin/         # owner panel: login, overview, products CRUD, orders
  components/site/   # hero, header, cart drawer, animations, product cards
  components/admin/  # forms, order status controls
  lib/               # Supabase clients, cart state, server actions, types
  proxy.ts           # protects /admin behind Supabase auth
supabase/
  schema.sql         # tables, security policies, image storage bucket
  seed.sql           # optional sample menu
```

## Notes & design decisions

- **Payments** happen in store at pickup — no card processing online. Stripe can
  be added later at the checkout step if wanted.
- **Languages**: the EN/DE toggle stores a cookie; UI text lives in
  `src/lib/i18n/dictionaries.ts`, product/category translations in the database.
- **Drink options** (milk alternatives, boba toppings) are handled via the
  free-text note at checkout for now; proper variants can be added later.
- **Dish photos** currently point at the old website's image host
  (DigitalOcean Spaces). If that site is ever shut down, re-upload the photos
  through the admin panel — uploads go to your own Supabase storage.
- **Security**: the database uses Row Level Security. Visitors can only read
  live products and create orders; every write to products/categories and all
  order management requires a signed-in staff user. Orders can never be listed
  with the public key — the confirmation page uses a lookup function that
  requires the exact unguessable order ID and returns no contact details.
  Stock is decremented by a database trigger, so it can't be bypassed or
  oversold by racing checkouts.
- **Secret keys**: the Supabase *secret* key is never used — don't put it in
  any env file of this project. The only server-side secret is the optional
  `RESEND_API_KEY` for email campaigns (see `.env.example`).
- **Email sending** uses [Resend](https://resend.com) (free tier: 3,000
  emails/month). Without a key configured, the Customers page still works —
  use *Copy all emails* and BCC from your own mail program.
- **Brand palette**: sand `#C7A880`, matcha `#9DB34B`, ink `#121A25`, cream `#EAE3DA`.
