# 🌿 Plants Collective Admin Panel

Admin dashboard to manage your Plants Collective app and website.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd admin-panel
npm install
```

### 2. Set Up Environment
Create a `.env` file:
```
VITE_SUPABASE_URL=https://vwdrevguebayhyjfurag.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
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

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview stats, recent users, quick actions |
| **User Management** | View, search, export, delete users |
| **Product Carousel** | Add/edit products for home screen |
| **Blog Posts** | Create and publish blog articles |
| **Notifications** | Send in-app notifications to users |
| **AI Knowledge Base** | Add content for AI to learn from |
| **App Config** | Maintenance mode, force update, contact info |
| **Analytics** | User statistics and insights |
| **Settings** | Admin profile and password |

---

## 🔧 Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- TanStack Query
- Lucide Icons

---

## 📂 Project Structure

```
admin-panel/
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # Auth context
│   ├── lib/            # Supabase client, utils
│   ├── pages/          # Page components
│   ├── App.tsx         # Main app with routes
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind styles
├── public/
├── package.json
└── vite.config.ts
```

---

## 🔐 Security Notes

1. Change default admin password immediately
2. Use environment variables for API keys
3. Don't commit `.env` files to git
4. Consider adding proper password hashing in production

---

## 🚀 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

Built with ❤️ for Plants Collective

