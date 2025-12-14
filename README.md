# 🌿 Plants Collective

A comprehensive skincare and haircare companion app with AI-powered features, skin analysis, and admin panel.

## 📱 Features

### Main App (`plants collective/`)
- **Know Your Skin**: AI-powered skin analysis with photo upload
- **Know Your Hair**: Hair type analysis and recommendations
- **Ask AI**: Conversational AI assistant with knowledge base integration
- **Blogs**: External blog card system with notifications
- **Progress Tracking**: Track your skincare journey over time
- **Community**: User engagement features
- **Notifications**: Real-time in-app notifications

### Admin Panel (`admin-panel/`)
- **Dashboard**: Analytics and overview
- **User Management**: View and manage users
- **Blog Management**: Create blog cards with external links
- **AI Knowledge Base**: Upload PDFs and documents for AI learning
- **Notifications**: Send notifications to all users
- **App Configuration**: Maintenance mode, force updates, contact info
- **Product Carousel**: Manage home screen products
- **Gold Meet**: Video content management

## 🚀 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Capacitor (for mobile apps)

### Backend
- Supabase (Database, Storage, Edge Functions)
- Gemini AI (via Supabase Edge Functions)
- PDF.js (for document processing)

### Admin Panel
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Quill (Rich text editor)

## 📦 Project Structure

```
Plants Collective/
├── plants collective/          # Main mobile/web app
│   ├── src/
│   │   ├── pages/             # App pages
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API services
│   │   └── lib/               # Utilities & config
│   └── android/               # Android build files
│
├── admin-panel/               # Admin dashboard
│   ├── src/
│   │   ├── pages/             # Admin pages
│   │   ├── components/        # Admin components
│   │   └── lib/               # Supabase client
│
└── supabase-functions/        # Supabase Edge Functions
    ├── ask-plants-collective/ # AI chat function
    └── skin-analyze/          # Skin analysis function
```

## 🔧 Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account
- Gemini API key

### Main App Setup
```bash
cd "plants collective"
npm install
cp .env.example .env  # Add your environment variables
npm run dev
```

### Admin Panel Setup
```bash
cd admin-panel
npm install
cp .env.example .env  # Add your environment variables
npm run dev
```

### Environment Variables

**Main App** (`plants collective/.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ASK_PLANTS_COLLECTIVE_URL=your_edge_function_url
VITE_SKIN_ANALYZE_URL=your_skin_analyze_url
```

**Admin Panel** (`admin-panel/.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup
Run the SQL scripts in Supabase SQL Editor:
1. `SUPABASE_SETUP.sql` - Main database schema
2. `CONVERSATIONS_SETUP.sql` - AI conversations tables
3. `PRODUCTS_CAROUSEL_SETUP.sql` - Products table
4. `BLOG_EXTERNAL_LINK_MIGRATION.sql` - Blog external links

### Supabase Edge Functions
```bash
# Deploy AI chat function
cd supabase-functions/ask-plants-collective
supabase functions deploy ask-plants-collective

# Deploy skin analysis function
cd supabase-functions/skin-analyze
supabase functions deploy skin-analyze

# Set secrets
supabase secrets set GEMINI_API_KEY=your_key
```

## 📱 Mobile App Build

See `APK_BUILD_INSTRUCTIONS.md` for Android build instructions.

## 🔐 Security Notes

- Never commit `.env` files
- Keep API keys secure
- Use Supabase RLS policies
- Change default admin password

## 📄 License

Private repository - All rights reserved

## 👥 Contributors

HASHTECHVENTURES



