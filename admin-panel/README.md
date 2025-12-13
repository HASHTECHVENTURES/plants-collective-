# 🌿 Plants Collective Admin Panel

Professional admin dashboard for managing the Plants Collective app - user management, blog posts, AI knowledge base, notifications, and more.

## ✨ Features

### 📊 Dashboard
- Overview statistics
- Recent user activity
- Quick actions

### 👥 User Management
- View all users
- Search and filter users
- Export user data
- Delete users

### 📝 Blog Management
- Create blog cards with external links
- Upload featured images
- Category and tag management
- Publish/unpublish blogs
- Send notifications to all users when publishing

### 🤖 AI Knowledge Base
- Upload PDF and TXT documents
- Extract text from PDFs with progress tracking
- Organize by categories
- View document content
- Documents are automatically used by AI in conversations

### 🔔 Notifications
- Send notifications to all users or specific users
- Different notification types (info, promo, alert, update)
- Schedule notifications
- Track notification status

### ⚙️ App Configuration
- Maintenance mode toggle
- Force app updates
- Contact information
- App version management

### 🎨 Product Carousel
- Manage home screen product carousel
- Add images and videos
- Set display order
- Enable/disable products

### 📹 Gold Meet
- Manage video content
- Categories and search
- Featured videos

### 📈 Analytics
- User statistics
- Growth metrics
- Gender and location breakdowns

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create a `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:5174

### 4. Default Login
- **Email:** admin@plantscollective.com
- **Password:** admin123

⚠️ **Change this password after first login!**

## 🔧 Tech Stack

- **React 18** + TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Supabase** - Database & Storage
- **React Quill** - Rich text editor (for future use)
- **PDF.js** - PDF text extraction
- **React Router** - Navigation
- **TanStack Query** - Data fetching
- **Lucide Icons** - Icons

## 📂 Project Structure

```
admin-panel/
├── src/
│   ├── components/        # Reusable components
│   │   ├── BlogEditor.tsx # Rich text editor (for future use)
│   │   └── Layout.tsx     # Main layout wrapper
│   ├── context/           # React context (Auth)
│   ├── lib/               # Utilities & Supabase client
│   ├── pages/             # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── BlogsPage.tsx
│   │   ├── KnowledgePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── ...
│   ├── App.tsx            # Main app with routes
│   └── main.tsx           # Entry point
├── public/
│   └── pdf.worker.min.js  # PDF.js worker
└── package.json
```

## 🔑 Key Features Details

### Blog Management
- **External Links**: Blog cards link to external URLs
- **Image Upload**: Upload featured images (stored as base64 or Supabase Storage)
- **Categories & Tags**: Organize blogs with categories and tags
- **Notifications**: Automatically notify users when publishing

### AI Knowledge Base
- **PDF Support**: Upload PDFs and extract text automatically
- **Progress Tracking**: See real-time progress during PDF extraction
- **Text Files**: Also supports .txt files
- **Categories**: Organize documents by category
- **AI Integration**: Documents are automatically used by the AI chat feature

### Notifications
- **Broadcast**: Send to all users or specific users
- **Types**: Info, Promo, Alert, Update
- **Links**: Include links that navigate users to specific pages
- **Scheduling**: Schedule notifications for later

## 🔐 Security

1. Change default admin password immediately
2. Use environment variables for API keys
3. Don't commit `.env` files
4. Use Supabase RLS policies for data security

## 📱 Database Requirements

The admin panel requires these Supabase tables:
- `admin_users` - Admin authentication
- `profiles` - User profiles
- `blog_posts` - Blog posts (with `external_link` column)
- `blog_tags` - Blog tags
- `knowledge_documents` - AI knowledge base
- `notifications` - Notifications
- `user_notifications` - User notification mapping
- `app_config` - App configuration
- `products_carousel` - Product carousel
- `feedback_submissions` - User feedback

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Deploy the `dist` folder to any static hosting:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 📄 License

Private repository - All rights reserved

## 👥 Contributors

HASHTECHVENTURES
