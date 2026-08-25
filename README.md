# Grainbuds

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

4. **Configure the owner's login**: set `ORDER_ADMIN_EMAILS` to a comma-separated
   list of approved addresses and set the server-only `SUPABASE_SECRET_KEY`.
   Admins use the same passwordless email-code login as customers. After a
   verified allowlisted login, the server automatically maintains the matching
   `grainbuds_staff` row required by the database security policies. Removing an
   address from `ORDER_ADMIN_EMAILS` blocks future admin access.
5. **Add the keys to the site**: copy `.env.example` to `.env.local` and fill in
   the values from **Project Settings → API Keys**: the Project URL, the
   **publishable** key (`sb_publishable_...`), and the server-only **secret** key
   (`sb_secret_...`). The secret key is used only on the server to read protected
   notification recipients; never give it a `NEXT_PUBLIC_` prefix. Older
   projects with a legacy `anon` key can use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Restart `npm run dev`. The shop now reads from your database, orders are
   saved, and `/admin/login` works.

### Enable customer email codes and loyalty

For an existing database, run
[`supabase/migrations/20260825_customer_loyalty.sql`](supabase/migrations/20260825_customer_loyalty.sql)
and
[`supabase/migrations/20260825_resend_auth_rate_limit.sql`](supabase/migrations/20260825_resend_auth_rate_limit.sql)
and
[`supabase/migrations/20260825_drink_loyalty_rewards.sql`](supabase/migrations/20260825_drink_loyalty_rewards.sql)
and
[`supabase/migrations/20260825_product_loyalty_eligibility.sql`](supabase/migrations/20260825_product_loyalty_eligibility.sql)
and
[`supabase/migrations/20260825_loyalty_balance_editor.sql`](supabase/migrations/20260825_loyalty_balance_editor.sql)
once each in the SQL Editor. Login codes are generated securely against the
Supabase identity but delivered directly through Resend; Supabase's email
mailer and email template are not used. Set `RESEND_API_KEY` and a verified
`AUTH_FROM_EMAIL` or `ORDER_FROM_EMAIL` sender before testing.

Customer login is optional and guest checkout continues to work. Each eligible
drink in a signed-in order earns one stamp when staff marks the order **Paid**.
After 10 stamps, one unit of the lowest-priced eligible drink in the next order
is automatically free and shown at checkout. Cancelling or refunding restores
the reserved reward as appropriate, while refunded paid drinks lose their
stamps. Admin → Customers provides an editable stamp balance with an explicit
save button; each saved difference is recorded as one audited adjustment.
Each product also has a **Stempelkarte** checkbox in its Admin edit form, so
eligibility can be changed without modifying categories or code. The setting is
snapshotted when an order is placed and never rewrites past stamp history.

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
  which stamps the payment time so you have a full payment history. Customers
  can update their contact, pickup, and kitchen-note details from their private
  order link while the order is *New* or *In progress*. A red badge in the
  admin navigation shows how many orders are still *New* and refreshes while
  the admin app is open.
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
- **Settings** — maintain staff order-notification emails and the Instagram
  profile/gallery shown on the homepage. Customers receive email when an order
  is created and if it is cancelled.

Changes go live on the website within about a minute.

## Deploying

The easiest path is [Vercel](https://vercel.com): import the repo, set the
environment variables from `.env.local`, deploy. Any Node host works
(`npm run build && npm start`).

The canonical production URL is `https://grainbuds.de`. Requests to the old
`grainbuds.vercel.app` hostname are permanently redirected to the same path on
the custom domain, and customer order emails always use `grainbuds.de` links.

For an existing Grainbuds database, run
[`supabase/migrations/20260821_order_edits_and_notifications.sql`](supabase/migrations/20260821_order_edits_and_notifications.sql)
followed by
[`supabase/migrations/20260821_queue_estimates.sql`](supabase/migrations/20260821_queue_estimates.sql)
and
[`supabase/migrations/20260821_instagram_gallery.sql`](supabase/migrations/20260821_instagram_gallery.sql)
once each in Supabase SQL Editor. All migrations preserve existing products and
orders.

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
- **Privacy and browser storage**: the public site uses only necessary storage
  for consent acknowledgement, language, cart, and requested customer or staff sessions; there are no
  analytics or advertising trackers. The bilingual `/privacy` page documents
  the current data flows. Before production use, confirm the controller's exact
  legal name/contact details and obtain professional review; this repository is
  not a substitute for legal advice or a complete German imprint.
- **Drink options** (milk alternatives, boba toppings) are handled via the
  free-text note at checkout for now; proper variants can be added later.
- **Dish photos** currently point at the old website's image host
  (DigitalOcean Spaces). If that site is ever shut down, re-upload the photos
  through the admin panel — uploads go to your own Supabase storage.
- **Security**: the database uses Row Level Security. Visitors can only read
  live products and create orders; every write to products/categories and all
  order management requires a signed-in staff user. Orders can never be listed
  with the public key — the confirmation page uses a lookup function that
  requires the exact unguessable order ID. That private link acts as the
  customer's capability to view and edit pickup details while an order is
  still new or in progress; it must not be shared publicly.
  Stock is decremented by a database trigger, so it can't be bypassed or
  oversold by racing checkouts.
- **Secret keys**: `SUPABASE_SECRET_KEY` and `RESEND_API_KEY` are server-only.
  Never prefix them with `NEXT_PUBLIC_`, commit real values, or expose them to
  browser code.
- **Email sending** uses [Resend](https://resend.com) (free tier: 3,000
  emails/month). Verify the sending domain, set `RESEND_API_KEY` and
  `ORDER_FROM_EMAIL` (and optionally `AUTH_FROM_EMAIL`), then configure recipients in Admin → Settings. Without a
  key, order operations still succeed but notification delivery is skipped.
- **Brand palette**: sand `#C7A880`, matcha `#9DB34B`, ink `#121A25`, cream `#EAE3DA`.
