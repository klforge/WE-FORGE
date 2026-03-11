const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Use Node's built-in env loader (Node 20.6+) — avoids dotenvx exit behaviour
try {
  process.loadEnvFile(path.resolve(__dirname, '..', '.env'));
} catch (e) {
  console.warn('Could not load .env file:', e.message);
}

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const eventRoutes = require('./routes/events');
const noticeRoutes = require('./routes/notices');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5174', 'http://127.0.0.1:5174',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`✓ KLFORGE API running on http://localhost:${PORT}`);
});
