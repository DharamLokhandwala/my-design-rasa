# Deploy My Design Rasa to Vercel

Follow these steps to get a live link for this Next.js app.

## 1. Get your code on GitHub

If Git isn’t set up yet:

1. Install [Git](https://git-scm.com/download/win) and ensure `git` is in your PATH.
2. In the project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Create a new repository on [GitHub](https://github.com/new) (e.g. `my-design-rasa`).
4. Add the remote and push:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/my-design-rasa.git
   git branch -M main
   git push -u origin main
   ```

**Alternative (no GitHub):** You can deploy with the [Vercel CLI](https://vercel.com/docs/cli) by running `npx vercel` in the project folder and following the prompts.

---

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. **Continue with GitHub**).
2. Click **Add New…** → **Project**.
3. Import your repository (`my-design-rasa`). Leave the framework as **Next.js**.
4. **Environment variables:** Before deploying (or right after), go to **Settings** → **Environment Variables** and add:

   | Name                         | Value                    | Environments   |
   | --------------------------- | ------------------------ | -------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`  | Your Supabase project URL | Production, Preview |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key   | Production, Preview |
   | `ANTHROPIC_API_KEY`         | Your Anthropic API key   | Production, Preview |

   Copy the values from your local `.env.local` (do not commit `.env.local`).

5. Click **Deploy**. After the build finishes, you’ll get a URL like `https://my-design-rasa-xxx.vercel.app`.

6. If you added env vars after the first deploy: **Deployments** → **…** on the latest deployment → **Redeploy**.

---

## 3. Configure Supabase for the live URL

So sign-in and redirects work on your live site:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL configuration**.
3. Set **Site URL** to your Vercel URL, e.g. `https://my-design-rasa-xxx.vercel.app`.
4. Under **Redirect URLs**, add the same URL and any preview URLs you use, e.g.:
   - `https://my-design-rasa-xxx.vercel.app/**`
   - `https://*.vercel.app/**` (if you use Vercel preview deployments).

Save. Your live link should now work with auth and database.

---

## 4. Optional: custom domain

In the Vercel project: **Settings** → **Domains** → add your domain and follow the DNS instructions. Then add that domain to Supabase **Site URL** and **Redirect URLs** as well.

---

## Checklist

- [ ] Code pushed to GitHub (or using Vercel CLI).
- [ ] Vercel project created and env vars set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`).
- [ ] Supabase **Site URL** and **Redirect URLs** updated to your Vercel URL.
- [ ] Redeployed after changing env vars (if needed).
