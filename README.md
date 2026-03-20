# KLFORGE Club Platform
🚀 **A modern, full-stack club ecosystem built with React (Vite) and Express.js.**

KLFORGE is a community platform designed to showcase club activities, domains, team members, and projects. It features a premium, interactive user interface powered by advanced animation libraries and a secure, data-driven backend for dynamic content management.

## ✨ Key Features

- **Premium UI & Animations:** 
  - Smooth scrolling powered by **Lenis**.
  - Advanced staggered block-reveals and parallax interactions using **GSAP** and **Framer Motion**.
  - Dynamic **Magic Bento Grid** for navigating domains, notices, and events.
- **Dynamic Content:** Everything from Team Members to ongoing Events is fetched securely from the backend.
- **Secure Admin Dashboard:** A protected portal using JWT authentication to manage notices, projects, events, and members.
- **Optimized Assets:** Seamless media handling and image uploads using cloud integration pipelines.

## 📂 Architecture & Structure

```
KLFORGE/
├── src/                # Frontend React Application (Vite)
│   ├── components/     # Reusable UI elements (Hero, Bento Grid, Footer, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Full page views (Team, Domains, FAQ, Admin Dashboard)
│   ├── services/       # API abstraction layer
│   └── index.css       # Core global styles & design tokens
├── server/             # Backend Express API
│   ├── data/           # JSON datastores for dynamic content
│   ├── middleware/     # Auth and error middleware
│   ├── routes/         # API endpoints
│   ├── lib/            # Shared logic (e.g. uploadHelper.js)
│   └── uploads/        # Local fallback media storage
```

## 🛠️ Prerequisites
- **Node.js**: v18 or standard LTS.
- **npm**: v9+

## 🚀 Setup & Run Locally

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Configure environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   # Secret key for JWT authentication (required for admin login)
   JWT_SECRET=your_jwt_secret_here

   # Bcrypt hash of the admin password
   ADMIN_PASSWORD_HASH=your_bcrypt_hash_here

   # Port for the backend API
   API_PORT=3001
   ```

3. **Start the Platform:**
   You can start both the frontend and the backend simultaneously:
   ```sh
   npm run dev:all
   ```
   *Alternatively, run `npm run server` and `npm run dev` in separate terminals.*

## 🎨 Design Philosophy
The design language mimics high-end editorial and tech-focused brand sites. Interactive moments (like the **Team Page's staged card reveal**) employ `clip-path` masks, hardware-accelerated transforms, and easing curves carefully tuned to feel cinematic without compromising rendering performance.

## 📄 License
MIT License. Available for educational and community use.
