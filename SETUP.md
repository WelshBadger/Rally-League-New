# Rally League — Setup Guide

Follow these steps in order. Each takes about 5–10 minutes.

---

## 1. Install Node.js (if you don't have it)

Download from: https://nodejs.org → click the LTS version → install it.

---

## 2. Install project dependencies

Open a terminal (Windows: press Win+R, type `cmd`, press Enter), then run:

```bash
cd "C:\Users\Gaming PC\Claude\Projects\App"
npm install
```

---

## 3. Set up Supabase (your database + auth)

1. Go to https://supabase.com and create a free account
2. Click **New project** → give it a name like "rally-league" → set a database password → Create
3. Wait ~2 minutes for it to set up
4. Go to **Settings → API** and copy:
   - Project URL (looks like `https://xxxx.supabase.co`)
   - `anon` `public` key
5. Go to **Storage** → click **New bucket** → name it `rally-docs` → tick **Public bucket** → Save

**Run the database schema:**
1. In Supabase, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this folder
3. Paste the contents and click **Run**

---

## 4. Set up Stripe (for organiser payments)

1. Go to https://stripe.com → create a free account
2. In your Stripe dashboard, go to **Developers → API keys**
3. Copy the **Publishable key** (starts with `pk_live_` or `pk_test_`)
4. Copy the **Secret key** (starts with `sk_live_` or `sk_test_`) — you'll need this later

---

## 5. Create your environment file

1. Copy `.env.example` → rename it to `.env`
2. Fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
VITE_EVENT_PRICE_PENCE=5000
VITE_APP_URL=http://localhost:5173
```

---

## 6. Deploy the Supabase Edge Functions

In your terminal (inside the App folder):

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project (get your project ref from Supabase → Settings → General)
supabase login
supabase link --project-ref your-project-ref

# Set secrets (replace with your actual values)
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key
supabase secrets set EVENT_PRICE_PENCE=5000

# Deploy the functions
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

**Set up the Stripe webhook:**
1. In Stripe → Developers → Webhooks → Add endpoint
2. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Events: select `checkout.session.completed`
4. Copy the **Signing secret** and add it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret
   ```

---

## 7. Run locally to test

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 8. Deploy to Vercel (go live)

1. Push your code to GitHub (create a free account at https://github.com if needed)
2. Go to https://vercel.com → Import your GitHub repo
3. Add your environment variables (same as your `.env` file, but update `VITE_APP_URL` to your Vercel URL)
4. Click Deploy

Your app will be live at a URL like `https://rally-league.vercel.app`

Update your Stripe webhook URL to the live Vercel URL once deployed.

---

## Done! 🎉

- Competitors: visit the site and browse events for free
- Organisers: register → create event → pay → upload documents
- You: collect payments, grow the platform

For help at any step, open a new conversation with Claude and paste the error message.
