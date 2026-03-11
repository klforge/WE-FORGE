const API_BASE = '/api';

async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
}

const noticeService = {
    async getAll() {
        const res = await fetch(`${API_BASE}/notices`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load notices');
        return safeJson(res);
    },

    async create(data) {
        const res = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to create notice');
        }
        return safeJson(res);
    },

    async update(id, data) {
        const res = await fetch(`${API_BASE}/notices/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to update notice');
        }
        return safeJson(res);
    },

    async remove(id) {
        const res = await fetch(`${API_BASE}/notices/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to delete notice');
        }
        return safeJson(res);
    },
};

export default noticeService;
