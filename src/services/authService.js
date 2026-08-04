const API_BASE = '/api';

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

const authService = {
  // Check if the current Microsoft session has admin access
  async checkAuth() {
    try {
      const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
      const data = await safeJson(res);
      return data.authenticated === true;
    } catch {
      return false;
    }
  },

  // No-op — logout is handled by NextAuth signOut() in the dashboard
  async logout() {
    // Use next-auth signOut() directly on the client side
  },
};

export default authService;
