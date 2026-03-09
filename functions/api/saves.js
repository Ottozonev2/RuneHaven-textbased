// functions/api/saves.js
// Cloudflare Pages Function for Game Saves
// Handles GET /api/saves  → load all slot data for this user
// Handles POST /api/saves → save all slot data for this user

export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    // ── 1. Helper: CORS headers ───────────────────────────────────────
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    // ── 2. Handle CORS Pre-flight ─────────────────────────────────────
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ── 3. Auth: Extract User ID from JWT ──────────────────────────────
    // Note: In a production app, you should verify the JWT signature.
    // For this migration, we extract the 'sub' (User ID) from the Clerk token.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: corsHeaders
        });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    
    try {
        // Simple base64 decode for the payload to get the userId
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub; 
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid Token' }), {
            status: 403,
            headers: corsHeaders
        });
    }

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID not found' }), {
            status: 403,
            headers: corsHeaders
        });
    }

    // ── 4. KV Storage Access ──────────────────────────────────────────
    // You MUST create a KV namespace in Cloudflare and bind it as SAVES_KV
    const SAVES = env.SAVES_KV;
    if (!SAVES) {
        return new Response(JSON.stringify({ error: 'SAVES_KV binding missing' }), {
            status: 500,
            headers: corsHeaders
        });
    }

    // ── 5. GET: Load Saves ────────────────────────────────────────────
    if (method === 'GET') {
        try {
            const raw = await SAVES.get(userId);
            return new Response(raw || JSON.stringify({ slots: {} }), {
                status: 200,
                headers: corsHeaders
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Failed to load' }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    // ── 6. POST: Save Slots ───────────────────────────────────────────
    if (method === 'POST') {
        try {
            const body = await request.json();

            // Basic validation
            if (typeof body !== 'object' || typeof body.slots !== 'object') {
                return new Response(JSON.stringify({ error: 'Invalid slots object' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            // Size guard: 200KB limit
            const serialised = JSON.stringify(body);
            if (serialised.length > 200000) {
                return new Response(JSON.stringify({ error: 'Payload too large' }), {
                    status: 413,
                    headers: corsHeaders
                });
            }

            await SAVES.put(userId, serialised);
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: corsHeaders
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Save failed' }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders
    });
}
