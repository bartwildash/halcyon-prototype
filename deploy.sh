#!/bin/bash
set -e

echo "🔨 Building Halcyon..."
npm run build

echo ""
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name halcyon-app --branch main

echo ""
echo "✨ Deploy complete!"
echo "📍 Preview: https://halcyon-app.pages.dev"
echo "📍 Production: https://halcyon.computer (after DNS setup)"
