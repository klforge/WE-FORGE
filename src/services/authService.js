const API_BASE = '/api';

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

const authService = {
  async login(password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.error || 'Login failed');
    }
    return safeJson(res);
  },

  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async checkAuth() {
    try {
      const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
      const data = await safeJson(res);
      return data.authenticated === true;
    } catch {
      return false;
    }
  },
};

export default authService;
