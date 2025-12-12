#!/bin/bash

# Deploy Skin Analyze Edge Function to Supabase
# This script helps deploy the skin-analyze function

set -e

echo "🚀 Deploying Skin Analyze Edge Function to Supabase"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  brew install supabase/tap/supabase"
    echo "  OR"
    echo "  npm install -g supabase"
    echo ""
    echo "Or deploy manually via Supabase Dashboard (see DEPLOY_SKIN_ANALYZE.md)"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Check if project is linked
PROJECT_REF="vwdrevguebayhyjfurag"
if [ ! -f ".supabase/config.toml" ]; then
    echo "📎 Linking to Supabase project..."
    supabase link --project-ref $PROJECT_REF
fi

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY environment variable is not set."
    echo ""
    read -p "Enter your Gemini API key (or press Enter to skip): " api_key
    if [ -n "$api_key" ]; then
        export GEMINI_API_KEY="$api_key"
        echo "🔐 Setting GEMINI_API_KEY secret in Supabase..."
        supabase secrets set GEMINI_API_KEY="$api_key"
    else
        echo "⚠️  Skipping API key setup. Make sure to set it manually in Supabase Dashboard:"
        echo "   Settings → Edge Functions → Secrets"
        echo ""
    fi
else
    echo "🔐 Setting GEMINI_API_KEY secret in Supabase..."
    supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"
fi

# Deploy the function
echo ""
echo "📦 Deploying skin-analyze function..."
cd supabase/functions
supabase functions deploy skin-analyze

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the function in Supabase Dashboard"
echo "2. Try the skin analysis in your app"
echo "3. Check function logs if you encounter any issues"
echo ""
