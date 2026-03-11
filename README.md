# KLFORGE Club Website

A modern, full-stack club website for KLFORGE, built with React (Vite) and Express.js. Features include:

- Animated hero section and bento grid
- Team member profiles and expandable cards
- Event registration and management
- Admin dashboard (password protected)
- Project and notice management

## Folder Structure

```
KLFORGE/
├── src/                # Frontend React app
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components (Team, Events, Admin, etc.)
│   ├── services/       # API service modules
│   ├── assets/         # Static images/assets
│   ├── index.css       # Global styles
│   └── main.jsx        # App entry point
├── server/             # Backend Express API
│   ├── data/           # JSON data files
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route handlers
│   ├── uploads/        # Uploaded images
│   └── index.js        # API entry point
├── index.html          # Main HTML file
├── package.json        # Project metadata and scripts
├── vite.config.js      # Vite config
└── .gitignore          # Git ignore rules
```

## Prerequisites
- Node.js 18+
- npm 9+

## Setup & Run

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` and fill in required secrets (see below).

3. **Start the backend API:**
   ```sh
   npm run server
   ```
   (Runs Express API on port 3001)

4. **Start the frontend (Vite):**
   ```sh
   npm run dev
   ```
   (Runs React app on port 5173)

Or, to run both together:
```sh
npm run dev:all
```


## Environment Variables
Create a `.env` file in the root (or copy `.env.example`):

```
# Secret key for JWT authentication (required for admin login)
JWT_SECRET=your_jwt_secret_here

# Bcrypt hash of the admin password (generate with bcryptjs or online tool)
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here

# Port for the backend API (default: 3001)
API_PORT=3001

# (Optional) Cloudflare R2 Storage Credentials
# Only needed if you use R2 for file/image uploads
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=your_r2_bucket_name
R2_ENDPOINT=your_r2_endpoint_url
```

**Never commit your .env file!**

## Build for Production
```sh
npm run build
```

## License
MIT
