// netlify/functions/saves.js
// Handles GET /api/saves  → load all slot data for this user
// Handles POST /api/saves → save all slot data for this user
// Auth: Netlify Identity JWT (Bearer token in Authorization header)

const { getStore } = require('@netlify/blobs');

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Pre-flight CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }

    // ── Auth: validate Netlify Identity token ──────────────────────────
    const { clientContext } = context;
    const user = clientContext?.user;

    if (!user || !user.sub) {
        return {
            statusCode: 401,
            headers: CORS,
            body: JSON.stringify({ error: 'Not authenticated. Please log in.' })
        };
    }

    const userId = user.sub; // unique stable ID from Netlify Identity
    const store = getStore('rune-haven-saves');

    // ── GET: load saves ────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
        try {
            const raw = await store.get(userId, { type: 'text' });
            return {
                statusCode: 200,
                headers: CORS,
                body: raw || JSON.stringify({ slots: {} })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: 'Failed to load save data.' })
            };
        }
    }

    // ── POST: save slots ───────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body || '{}');

            // Basic validation – must have a slots object
            if (typeof body !== 'object' || typeof body.slots !== 'object') {
                return {
                    statusCode: 400,
                    headers: CORS,
                    body: JSON.stringify({ error: 'Invalid payload. Expected { slots: {...} }' })
                };
            }

            // Guard: no single save slot bigger than 100 KB
            const serialised = JSON.stringify(body);
            if (serialised.length > 200_000) {
                return {
                    statusCode: 413,
                    headers: CORS,
                    body: JSON.stringify({ error: 'Save data too large.' })
                };
            }

            await store.set(userId, serialised);
            return {
                statusCode: 200,
                headers: CORS,
                body: JSON.stringify({ ok: true })
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: 'Failed to write save data.' })
            };
        }
    }

    return {
        statusCode: 405,
        headers: CORS,
        body: JSON.stringify({ error: 'Method not allowed.' })
    };
};
