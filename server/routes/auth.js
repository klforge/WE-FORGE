const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Read env at request-time so a server restart always picks up fresh values
const getSecret = () => process.env.JWT_SECRET;
const getHash = () => process.env.ADMIN_PASSWORD_HASH;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const hash = getHash();
    if (!hash) return res.status(500).json({ error: 'Server misconfiguration: missing password hash' });

    const secret = getSecret();
    if (!secret) return res.status(500).json({ error: 'Server misconfiguration: missing JWT secret' });

    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/login] error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// GET /api/auth/check
router.get('/check', (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, getSecret());
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;
