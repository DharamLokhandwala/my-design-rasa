This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Environment variables

Create a `.env.local` file in the project root with:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – for Supabase auth and storage.
- `ANTHROPIC_API_KEY` – for AI-powered image analysis (lexicons). When uploading a photo, the app uses Claude (Anthropic) vision to suggest 5–6 design/aesthetic lexicons. If this key is missing or the API fails, the app falls back to mock lexicons so the flow still works.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

To publish this app to a live link, see **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions: push to GitHub, deploy on Vercel, set environment variables, and configure Supabase auth URLs.
