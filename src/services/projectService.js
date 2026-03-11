const API_BASE = '/api';

async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
}

const projectService = {
    async getAll() {
        const res = await fetch(`${API_BASE}/projects`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load projects');
        return safeJson(res);
    },

    async create(data) {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to create project');
        }
        return safeJson(res);
    },

    async update(id, data) {
        const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to update project');
        }
        return safeJson(res);
    },

    async remove(id) {
        const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const json = await safeJson(res);
            throw new Error(json.error || 'Failed to delete project');
        }
        return safeJson(res);
    },
};

export default projectService;
