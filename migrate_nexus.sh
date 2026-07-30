#!/usr/bin/env bash
set -e

echo "📦 [MIGRATION] Packaging Willstone Nexus for Free Cloud Hosting..."

# Step 1: Create a production-ready, lightweight Dockerfile
cat << 'DOCKER' > Dockerfile
FROM node:22.23.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001 4242
CMD ["node", "webhook_server.js"]
DOCKER

# Step 2: Ensure critical environment files are not leaked publicly
cat << 'IGNORE' > .gitignore
node_modules/
.env
*.bak
Milestone_*
IGNORE

# Step 3: Initialize Git repository for deployment mapping
if [ ! -d ".git" ]; then
    git init
    git config user.name "Timothy Huff"
    git config user.email "timothyhuff25@gmail.com"
fi

git add .
git commit -m "Feat: Migrate Nexus Core from Abacus to Free Tier Engine"

echo "======================================================================"
echo "🚀 [SUCCESS] Willstone Nexus is containerized and ready for deployment!"
echo "======================================================================"
echo "To finish your free deploy, select your preferred endpoint zone:"
echo ""
echo "🔹 OPTION A (Koyeb Backend Container - Recommended):"
echo "   Run: koyeb app init willstone-nexus --docker-dir=."
echo ""
echo "🔹 OPTION B (GitHub Push for Netlify/Render Autodeploy):"
echo "   Run: gh repo create willstone-nexus --public --source=. --remote=origin && git push -u origin main"
echo "======================================================================"
