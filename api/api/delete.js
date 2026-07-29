export const config = { runtime: 'edge' };

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    const authHeader = req.headers.get('authorization') || '';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Afjal7380';
    
    if (authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers 
        });
    }
    
    try {
        const { id } = await req.json();
        let deleted = false;
        
        try {
            const { kv } = await import('@vercel/kv');
            
            if (id === 'all') {
                const keys = await kv.keys('capture:*');
                if (keys && keys.length > 0) {
                    await kv.del(...keys);
                }
                deleted = true;
            } else if (id) {
                await kv.del(id);
                deleted = true;
            }
        } catch(kvError) {}
        
        return new Response(JSON.stringify({
            status: 'ok',
            deleted: deleted
        }), { status: 200, headers });
        
    } catch(err) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: err.message 
        }), { status: 500, headers });
    }
                   }
