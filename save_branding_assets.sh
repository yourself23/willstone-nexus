#!/usr/bin/env bash
set -euo pipefail

# Create a dedicated branding folder for your company assets
mkdir -p core/branding

# Map the live public Alamy illustration URL for your Stripe metadata registry
cat << 'JSON' > core/branding/image_manifest.json
{
  "product_name": "Willstone Nexus API Access",
  "theme_color": "Cyberpunk Neon Blue/Teal",
  "stripe_product_image_url": "https://alamy.com",
  "use_case": "Stripe Product Card / Customer Payment Link Branding"
}
JSON

echo "=============================================================================="
echo "⚡ SUCCESS: Branding manifest saved locally at core/branding/image_manifest.json"
echo "=============================================================================="
