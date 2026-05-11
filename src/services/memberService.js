const API_BASE = '/api';

// ── Utilities ────────────────────────────────────────────

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

// ── Helpers ──────────────────────────────────────────────

export const nameToSlug = (name) => {
  if (!name) return '';
  // Remove all non-alphanumeric, split by space, join first and second name, ignore extra names
  const parts = name.trim().toLowerCase().split(/\s+/);
  if (parts.length === 1) return parts[0].replace(/[^a-z0-9]/g, '');
  // Only use first and second name, remove non-alphanumeric, join
  return (parts[0] + parts[1]).replace(/[^a-z0-9]/g, '');
};

export const getAvatarUrl = (member) => {
  if (member.photoUrl) return member.photoUrl;
  const colorHex = (member.color && member.color.startsWith('#')) ? member.color.replace('#', '') : '71C4FF';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=1a1a2e&color=${colorHex}`;
};

export const toTeamCards = (members) =>
  members.map((m) => ({
    name: m.name,
    role: `${m.role}  •  ${m.rollNumber}`,
    description: m.description,
    profileLink: `/${m.id}`,
    color: m.color || '#71C4FF',
  }));

export const findBySlug = (members, slug) =>
  members.find((m) => m.id === slug || nameToSlug(m.name) === slug) || null;

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
