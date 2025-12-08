# Halcyon Prototype - Deployment Guide

## Recommended: Cloudflare Pages (Free & Fast)

### Step 1: Build the project
```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages

#### Option A: Via Dashboard (Easiest)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
3. Select your GitHub repo: `Halcyon/halcyon-prototype`
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `20`
5. Click "Save and Deploy"
6. Your site will be live at: `halcyon-prototype.pages.dev`

#### Option B: Via CLI (Faster)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=halcyon-prototype
```

---

## Alternative: Vercel

### Quick Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or via dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Halcyon/halcyon-prototype`
3. Click "Deploy"

---

## Alternative: Railway

### Quick Deploy
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select `Halcyon/halcyon-prototype`
4. Railway will auto-detect Vite and deploy
5. Your site will be at: `*.up.railway.app`

**Note:** Railway is best for apps needing a backend. For this static site, Cloudflare Pages is faster and free.

---

## Performance Comparison

| Platform | Speed | Free Tier | Best For |
|----------|-------|-----------|----------|
| **Cloudflare Pages** | ⚡⚡⚡ Fastest | Unlimited | Static sites (Recommended) |
| **Vercel** | ⚡⚡ Fast | 100GB/mo | Next.js, React apps |
| **Railway** | ⚡ Good | 500 hrs/mo | Full-stack apps with backend |

## Recommendation

✅ **Use Cloudflare Pages** for this prototype:
- Free forever
- Fastest global CDN
- Unlimited bandwidth
- Auto-deploys from GitHub
- Custom domains included
