const API_BASE = '/api';

// ── Utilities ────────────────────────────────────────────

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

// ── Helpers ──────────────────────────────────────────────

export const nameToSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const getAvatarUrl = (member) => {
  if (member.photoUrl) return member.photoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=1a1a2e&color=71C4FF`;
};

export const toTeamCards = (members) =>
  members.map((m) => ({
    name: m.name,
    role: `${m.role}  •  ${m.rollNumber}`,
    description: m.description,
    profileLink: `/${nameToSlug(m.name)}`,
  }));

export const findBySlug = (members, slug) =>
  members.find((m) => nameToSlug(m.name) === slug) || null;

// ── API ──────────────────────────────────────────────────

const memberService = {
  async getAll() {
    const res = await fetch(`${API_BASE}/members`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load members');
    const data = await safeJson(res);
    if (!Array.isArray(data)) throw new Error('Failed to load members');
    return data.map((m) => ({ ...m, avatarUrl: getAvatarUrl(m) }));
  },

  async add(formData) {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.error || 'Failed to add member');
    }
    return safeJson(res);
  },

  async update(id, formData) {
    const res = await fetch(`${API_BASE}/members/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.error || 'Failed to update member');
    }
    return safeJson(res);
  },

  async remove(id) {
    const res = await fetch(`${API_BASE}/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.error || 'Failed to delete member');
    }
    return safeJson(res);
  },

  async reorder(order) {
    const res = await fetch(`${API_BASE}/members/reorder/list`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error('Failed to reorder');
    return safeJson(res);
  },
};

export default memberService;
