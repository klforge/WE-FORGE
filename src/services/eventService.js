const API_BASE = '/api';

async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
}

const eventService = {
    async getAll() {
        const res = await fetch(`${API_BASE}/events`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load events');
        return safeJson(res);
    },

    async getById(id) {
        const res = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Event not found');
        return safeJson(res);
    },

    async create(formData) {
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data.error || 'Failed to create event');
        }
        return safeJson(res);
    },

    async update(id, formData) {
        const res = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            body: formData,
        });
        if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data.error || 'Failed to update event');
        }
        return safeJson(res);
    },

    async remove(id) {
        const res = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data.error || 'Failed to delete event');
        }
        return safeJson(res);
    },

    async register(id, data) {
        const res = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        const json = await safeJson(res);
        if (!res.ok) throw new Error(json.error || 'Registration failed');
        return json;
    },

    async getRegistrations(id) {
        const res = await fetch(`${API_BASE}/events/${encodeURIComponent(id)}/registrations`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load registrations');
        return safeJson(res);
    },
};

export default eventService;
