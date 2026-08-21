# Grainbuds — Matcha & Asian Café

A calm, animated website for Grainbuds with an online shop, pickup ordering, and
an admin panel where the owner manages products without touching code.

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
3. **Optional — load the sample menu**: run [`supabase/seed.sql`](supabase/seed.sql)
   the same way. Everything it adds can be edited or deleted in the admin panel.
4. **Create the owner's login**: dashboard → **Authentication → Users →
   Add user → Create new user**. Enter the owner's email and a password, and tick
   **Auto confirm user**. (Anyone you add here can access the admin panel —
   there is no self-signup.)
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
- **Products** — add, edit, hide, or delete anything on the menu:
  - *Show in shop* hides an item without deleting it (e.g. sold out today).
  - *House favorite* features it on the home page.
  - Upload a photo, or leave it empty for an automatic on-brand illustration.
  - Manage categories at the bottom of the Products page.
- **Orders** — new online orders appear here, newest first. Move them through
  *New → In progress → Ready for pickup → Completed* as you work. Customers pay
  in store at pickup.

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
- **Security**: the database uses Row Level Security. Visitors can only read
  live products and create orders; every write to products/categories and all
  order management requires a signed-in staff user. Order confirmation links use
  unguessable IDs.
- **Brand palette**: sand `#C7A880`, matcha `#9DB34B`, ink `#121A25`, cream `#EAE3DA`.
