This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

**Recipe Companion** needs the Python backend on port 8000. Set `NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000` in `.env`, then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a PDF or text recipe; use the chat sidebar for scaling, substitutions, and step-by-step help. API docs: [http://localhost:8000/docs](http://localhost:8000/docs).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Deploying backend (to run the app live)

The frontend calls the Python backend via **Next.js API routes** (`/api/upload`, `/api/health`, `/api/copilotkit/...`), which proxy to whatever URL you set in **`NEXT_PUBLIC_BACKEND_BASE_URL`**. So you can host the backend anywhere that serves HTTP.

### Where to host the backend

| Platform | Notes |
|----------|--------|
| **[Railway](https://railway.app)** | Simple: connect GitHub (backend repo or monorepo), add a Python service, set start command (e.g. `uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT`). Free tier available. |
| **[Render](https://render.com)** | Free tier for web services. Deploy from GitHub; use **Web Service**, build command `uv sync` (or `pip install -r requirements.txt`), start `uvicorn src.main:app --host 0.0.0.0 --port $PORT`. |
| **[Fly.io](https://fly.io)** | Good if you already use Docker. Free tier; deploy with `fly launch` and a `Dockerfile` or their Python buildpack. |
| **[Google Cloud Run](https://cloud.run)** | Pay-per-request; can stay in free tier for low traffic. Push a container or use Cloud Build from source. |
| **[PythonAnywhere](https://www.pythonanywhere.com)** | Python-focused; free tier for small apps. Manual setup (e.g. WSGI) rather than "connect repo and go". |

**Recommendation:** **Railway** or **Render** for the least friction: connect the repo that contains the backend (e.g. [Code-Challenge](https://github.com/phsims/Code-Challenge) or your fork), set build/start commands, add env vars (e.g. API keys from the backend README), and use the generated URL as the backend base URL.

### Wire Vercel (frontend) to the backend

1. Deploy the backend and copy its **public URL** (e.g. `https://your-app.railway.app` or `https://your-service.onrender.com`).
2. In the **Vercel** project for this frontend, go to **Settings → Environment Variables**.
3. Add **`NEXT_PUBLIC_BACKEND_BASE_URL`** = `https://your-backend-url` (no trailing slash).
4. Redeploy the frontend so the new value is baked in.

The app will then use your deployed backend for upload, health, and CopilotKit.

### CORS

If the backend restricts origins, allow your Vercel domain (e.g. `https://your-project.vercel.app` and any custom domain). The Code-Challenge backend may already allow `*` or a list of origins; if you see CORS errors in the browser, add your frontend origin in the backend CORS config.
