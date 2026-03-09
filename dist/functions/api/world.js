// functions/api/world.js
// Cloudflare Pages Function as a JSONBin.io replacement
// Handles multiplayer state, chat, and party sync using KV

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const binId = url.searchParams.get('bin'); // e.g. /api/world?bin=chat
    const method = request.method;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Master-Key',
        'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    if (!binId) {
        return new Response(JSON.stringify({ error: 'Missing bin ID' }), { status: 400, headers: corsHeaders });
    }

    // Use the existing SAVES_KV binding or default to a generic "BINS" binding
    const STORAGE = env.SAVES_KV;
    if (!STORAGE) {
        return new Response(JSON.stringify({ error: 'KV Binding SAVES_KV missing' }), { status: 500, headers: corsHeaders });
    }

    // JSONBin IDs usually look like '69ae...' - we'll prefix them to avoid collisions with user saves
    const kvKey = `world_bin_${binId}`;

    // ── GET: Fetch Bin ──
    if (method === 'GET') {
        try {
            const data = await STORAGE.get(kvKey);
            // If bin doesn't exist, return empty object to prevent errors
            return new Response(data || '{}', { status: 200, headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Read failure' }), { status: 500, headers: corsHeaders });
        }
    }

    // ── PUT/POST: Update Bin ──
    if (method === 'PUT' || method === 'POST') {
        try {
            const body = await request.text();

            // Basic JSON validation
            JSON.parse(body);

            // Size limit: 512KB for world state
            if (body.length > 512000) {
                return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: corsHeaders });
            }

            await STORAGE.put(kvKey, body);
            return new Response(JSON.stringify({ ok: true, metadata: { ts: Date.now() } }), { status: 200, headers: corsHeaders });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Write failure or invalid JSON' }), { status: 500, headers: corsHeaders });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
}
