# Photo Vote

A photo voting app — upload photos, share a link, collect votes, see live results.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (database + file storage + realtime)
- **Vercel** (hosting)

---

## Deploy in ~10 minutes

### Step 1 — Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project**, give it a name (e.g. `photo-vote`)
3. Once it's ready, go to **SQL Editor** and paste the contents of `supabase-setup.sql`, then click **Run**
4. Go to **Storage** → **New bucket**, name it `photos`, tick **Public bucket**, click **Create**
5. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "initial"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/photo-vote.git
git push -u origin main
```

### Step 3 — Deploy to Vercel (free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → import your `photo-vote` repo
3. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy** — done!

---

## Local development

```bash
cp .env.local.example .env.local
# Fill in your Supabase values in .env.local

npm install
npm run dev
# Open http://localhost:3000
```

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Admin — upload photos, get share link |
| `/vote` | Public voting page |
| `/results` | Live leaderboard (auto-updates) |

---

## Notes

- Votes are stored per-browser (localStorage) — one vote per device
- The results page uses Supabase Realtime to update without refreshing
- To restrict admin access, add authentication via Supabase Auth
