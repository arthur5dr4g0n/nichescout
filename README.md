# 📈 MarketMax — Amazon Niche Intelligence

> *Trouvez les niches qui rapportent.*

A single-page web app for Amazon FBA product research, in the spirit of **Helium 10 / Jungle Scout** —
clean light theme, deep-blue accents, data-forward layout. **Bilingual 🇫🇷 / 🇬🇧** (French default).

Search products, research keywords, spy on competitors, watch **Google Trends** + **Reddit buzz**,
auto-detect **hot niches**, organise them on a **Kanban board**, ask a **local AI assistant**, and
**sync everything to your account** — using **only free data sources** by default.

> **Works instantly with zero configuration.** It ships in **mock mode** + **guest mode** (no login
> needed), and free live sources (Trends, Reddit, Amazon, Ollama) **switch on automatically when they
> respond**. Add Supabase keys to unlock accounts + cross-device sync.

![mode](https://img.shields.io/badge/default-mock%20%2B%20auto--live-1b4fd8) ![stack](https://img.shields.io/badge/React-18-1b4fd8) ![css](https://img.shields.io/badge/TailwindCSS-3-38bdf8) ![keys](https://img.shields.io/badge/API%20keys-not%20required-16a34a)

---

## 🚀 Quick start

```bash
npm install
npm start
```

Open **http://localhost:5173**. That's it.

Build for production with `npm run build`, preview with `npm run preview`.

**Requirements:** Node.js 18+ and npm 9+.

---

## 🧭 Features

| Page | What it does |
| --- | --- |
| **Dashboard** | "Hot Niches Today" auto-scored from Trends + Reddit, KPI tiles, 7d/30d trending chart, live Reddit buzz, last-updated stamps. |
| **Search** | Keyword → products with price, BSR, est. sales, est. revenue, reviews, rating, sellers, FBA fee + Niche Score. |
| **Keywords** | Seed keyword → related terms with volume, competition, CPC, trend sparklines. CSV export. |
| **Competitors** | ASIN → top 10 competitors compared side-by-side + revenue-vs-reviews chart. |
| **Trends** | Google Trends: live daily searches + per-category rising/declining niches (7/30-day curves). |
| **Best Sellers** | Amazon.fr best sellers scraped by category (High-Tech, Cuisine, Sport, Beauté, Animalerie). |
| **Saved** | Shortlist synced to your account (or localStorage in guest mode), CSV export. |
| **Research Board** | Kanban: 🔍 À analyser / ⚡ En cours / ✅ Validée / ❌ Abandonnée — drag & drop, notes, synced, CSV export. |
| **AI Assistant** | Local Ollama chat, restricted to **factual** FBA questions (definitions only). |
| **Accounts** | Signup / login / logout + **Google OAuth**, email confirmation, "remember me", password reset (via Supabase). |
| **Profile** (`/profile`) | Edit name + avatar, change password (old-password check), plan + expiry, last-10 activity, danger zone (delete account / logout all devices). |
| **Admin panel** (`/admin`) | admin/super_admin only: list users, change role/plan, delete accounts, search by email (via SECURITY DEFINER RPCs). |
| **Pricing & Pro gating** (`/pricing`) | Free vs Pro; Pro-only actions (CSV exports) show a 🔒 upgrade modal for free users. |
| **Audit trail** | `activity_logs` records login, logout, role_change, plan_change, ban, delete_account + IP. |
| **Legal** | `/cgu`, `/confidentialite` (GDPR), `/cookies` + cookie-consent banner. Roles: `user` / `admin` / `super_admin` (1st user). |

Plus: **🇫🇷/🇬🇧 language toggle** (i18next, French default, saved to localStorage), **toast notifications**,
loading skeletons, offline indicator, and (i) tooltips on every metric — all translated.

Plus everywhere: **(i) tooltips** on every metric, loading skeletons, human-readable error states,
a **Niche Score (0–100)** colour-coded red/orange/green, an **offline indicator**, and **mobile responsive** layout.

---

## 🆓 Free data sources (no keys, auto-live)

These run through a small **dev-server proxy** (`vite.proxy.js`) that ships with the app. The proxy
runs server-side inside Vite, so it dodges browser CORS and can send a real `User-Agent`. Each source
**falls back to realistic mock data** when blocked/offline, and the UI labels the source
(🟢 *Live* / 🟠 *Mock*) with a *last updated* time.

> ℹ️ The proxy is active under `npm start` / `npm run dev`. A static `npm run build` has no server,
> so a deployed static build uses mock data only (or point the `/api/*` calls at your own backend).

### 1. Google Trends — ✅ usually live
- Live **daily trending searches** via Google's `trending/rss` feed.
- Per-category **rising/declining momentum** + 30-day curves are **modeled** (the public RSS can't
  supply per-keyword history without `pytrends`/a token). Clearly labeled "modeled" in the UI.
- Cached **24h** in localStorage.

### 2. Reddit FBA buzz — ✅ usually live (titles only)
- Pulls `r/AmazonFBA` and `r/FulfillmentByAmazon`.
- Reddit blocks the `.json` API without OAuth (HTTP 403), so the proxy **falls back to the public
  Atom RSS feed** → you get real post titles/links, but **no upvote/comment counts**.
- Cached **1h**. Shown on the Dashboard and in the sidebar "🔥 FBA Buzz" panel.

### 3. Amazon Best Sellers — ⚠️ often mock
- Best-effort scrape of `amazon.fr/gp/bestsellers/<category>` with **rotating user-agents**.
- Amazon aggressively blocks scraping (CAPTCHA / 503), especially from datacenter IPs, so this
  **commonly falls back to mock**. When live, only ASIN + title + rank are reliable; **sales are
  estimated from rank**.

### 4. Ollama AI assistant — local, private
- Talks to your local **Ollama** at `http://localhost:11434` (proxied to avoid CORS).
- **Factual only** — the system prompt forbids sales/profit predictions:
  > *You are a factual Amazon FBA assistant. Never estimate sales or predict profitability.
  > Only explain metrics and definitions. If unsure, say explicitly: I don't know.*
- **Enable it:**
  ```bash
  ollama pull mistral          # or llama3
  OLLAMA_ORIGINS=* ollama serve
  ```
  Reload the page — the assistant auto-detects the model. If Ollama isn't running, the page shows a
  built-in **offline glossary** instead.

### 🔥 Niche auto-detection
The Dashboard cross-references **Google Trends momentum** (45%) + **Reddit buzz** (30%) +
a **competition proxy** (25%) into a 0–100 score per niche, colour-coded, with the reasons shown.
One click sends a niche to your Kanban board.

---

## 👤 Setup Supabase (5 min) — accounts, sync, audit

Optional. Without it the app runs in **guest mode** (no login, data in localStorage). With it you get
signup/login (+ **Google OAuth**), a protected dashboard, a **profile page**, an **audit trail**, and
**Saved products + Kanban synced across devices**.

1. Create a free project at **https://supabase.com**.
2. **Project Settings → API** → copy the **Project URL** + **anon public** key into `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. **SQL Editor → New query** → paste & run **[`supabase/schema.sql`](supabase/schema.sql)** (in this repo).
   It creates `profiles`, `user_data`, `activity_logs`, row-level security, the self-service
   **delete-account** function, and a trigger that makes the **first registered user a `super_admin`**.
   Then run **[`supabase/admin.sql`](supabase/admin.sql)** too — it adds the admin-panel RPCs
   (`admin_list_users`, `admin_set_role`, `admin_set_plan`, `admin_delete_user`).
4. **Authentication → Providers → Email**: keep **Confirm email** on (auto-sends the confirmation email).
   Under **URL Configuration**, add your site URLs (localhost + your `.pages.dev`) so confirm/reset links work.
5. **(Optional) Google login** — Authentication → Providers → **Google** → enable. Create OAuth credentials
   in [Google Cloud Console](https://console.cloud.google.com) (OAuth consent screen + Web client), set the
   callback URL that Supabase shows you, and paste **Client ID + Secret** into Supabase. *No frontend keys needed.*
6. **(Optional) Avatar upload** — Storage → create a **public** bucket named `avatars`.
7. **(Optional) Email templates** — Authentication → Email Templates → brand *Confirm signup* and
   *Reset password* with the MarketMax logo + a clear button.
8. Restart `npm start`. You'll now see Login / Signup instead of guest mode.

> **On Cloudflare:** add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` under **Pages → Settings →
> Environment variables**, add your `*.pages.dev` URL to Supabase **URL Configuration**, then redeploy.

## 💳 Optional paid APIs (Search / Keywords)

The product Search and Keyword pages can use paid APIs for richer data. Edit `.env`
(`cp .env.example .env`) and set `REACT_APP_USE_MOCK=false`:

- **RapidAPI – Real-Time Amazon Data** (Search, Competitors): free Basic plan, put the key in
  `REACT_APP_RAPIDAPI_KEY`. Endpoints: `GET /search`, `GET /product-details`.
- **DataForSEO** (Keywords): Basic-auth login/password. Note: server-to-server, usually **CORS-blocked**
  from the browser — keep mock unless you proxy it.

If a key is missing, that module silently falls back to mock.

---

## 🧮 How the estimates work

Heuristics (same idea the big tools use), **not** official Amazon numbers — tweak in `src/utils/`:

- **Monthly sales** — power-law on BSR (`≈ factor × 100000 × BSR^-0.75`), tuned per category.
- **Monthly revenue** — `sales × price`. **FBA fee** — `15% referral + weight-based fulfillment`.
- **Niche Score** — 40% competition (reviews < 200) + 35% profitability (revenue > $5k/mo) + 25% price sweet-spot ($15–$70).

---

## 🗂️ Project structure

```
vite.proxy.js          # dev-server proxy: /api/{reddit,trends,amazon,ollama}
src/
├── api/        # data layer (mock + live) — amazon, keywords, trends, reddit, bestsellers, ollama
├── components/ # Sidebar, cards, tables, charts, HotNiches, BuzzFeed, Kanban bits, UI atoms, icons
├── hooks/      # useAsync, useSavedProducts, useKanban, useCachedResource (TTL), useOnline
├── pages/      # Dashboard, Search, Keywords, Competitors, Trends, BestSellers, Saved, Kanban, Assistant
├── utils/      # estimates, hotNiches, csv, cache, format, metric glossary
└── App.jsx
```

## 🎨 Theme
Light professional UI — white background, light-grey cards (`#F8F9FA`), deep-blue accent (`#1B4FD8`),
green (`#16A34A`) positive / red (`#DC2626`) warnings, Inter font, dark navy sidebar. No gradients, no neon.

## 🛠️ Tech stack
React 18 · Vite 5 (+ dev proxy) · Tailwind CSS 3 · Recharts · Axios · localStorage. Native HTML5
drag-and-drop (no DnD library). The `.env` keeps the `REACT_APP_` prefix and `npm start` works like CRA.

## ☁️ Deploy online (Cloudflare Pages + GitHub)

The live-data proxy is also shipped as **Cloudflare Pages Functions** (in `functions/api/*`), so the
deployed site keeps real Trends / Reddit / Amazon data — no separate backend needed.

1. Push this repo to GitHub (already done if you're reading this there).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version is pinned to 20 via `.nvmrc`.
4. **Save and Deploy.** Every `git push` auto-rebuilds.
5. (Optional) Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars to enable accounts online.

**Redeploy after changes:**
```bash
git add -A
git commit -m "your change"
git push
```
Cloudflare Pages rebuilds automatically on push to `main`.

### Rename the project to `marketmax`
The default URL follows the Pages **project name**. To get `marketmax.pages.dev`:
- Cloudflare → your Pages project → **Settings → General → Rename** → `nichescout` → `marketmax`.
- ⚠️ The URL changes, so update **Supabase → Auth → URL Configuration**: set **Site URL** to
  `https://marketmax.pages.dev` and add `https://marketmax.pages.dev/**` to **Redirect URLs**
  (otherwise Google/email auth redirects break). Update Google Cloud only if you used the app URL anywhere.

> ⚠️ From Cloudflare's datacenter IPs, Reddit and Amazon block scraping more aggressively than your
> home IP, so online they'll often show **mock** data (Google Trends usually stays live). The
> **AI Assistant is local-only** (Ollama on your machine) — online it shows the offline glossary.
> For the richest live data, also run it locally with `npm start`.

## ⚖️ Disclaimer
All figures are **estimates** for research/education. Respect Amazon's, Reddit's, Google's and any API
provider's Terms of Service. Scraping is best-effort and rate-limited by design — this is a learning
tool, not a scraping farm.
