# Store

## Deploy frontend and API together on Vercel

Create a Vercel project connected to this repository and keep the **Root Directory**
set to the repository root. `vercel.json` configures two services: the Vite frontend
serves all normal app routes, while FastAPI receives `/api/*` and `/health`.

Add these environment variables in the Vercel project settings for each environment
you deploy:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL used by the backend |
| `SUPABASE_SERVICE_KEY` | Backend-only Supabase service key; never use this as a `VITE_` variable |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Public app origin, for example `https://your-store.vercel.app` |
| `VITE_SUPABASE_URL` | Supabase project URL used by the browser |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anonymous key used by the browser |

`EXTRA_ORIGINS` and `SHIPPING_COUNTRIES` are optional backend settings. Since the
frontend and API share one origin, leave `VITE_API_URL` unset in Vercel; the
frontend will call `/api/...` on the deployed domain. Production builds always use
the same-origin API. For local development, `VITE_API_URL` may point directly to
the backend; otherwise Vite proxies `/api` to `http://localhost:8000`.

After deployment, configure Stripe to send its webhook to
`https://your-store.vercel.app/api/webhook`. Deployments require the Supabase and Stripe environment variables above to be
present before the backend can start.
