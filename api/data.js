export const config = { runtime: 'edge' };

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
        let captures = [];
        
        try {
            const { kv } = await import('@vercel/kv');
            const keys = await kv.keys('capture:*');
            
            if (keys && keys.length > 0) {
                const pipeline = kv.pipeline();
                keys.forEach(key => pipeline.get(key));
                const values = await pipeline.exec();
                
                captures = values.map((val, i) => ({
                    id: keys[i],
                    ...val
                }));
                
                captures.sort((a, b) => 
                    new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
                );
            }
        } catch(kvError) {}
        
        return new Response(JSON.stringify({
            status: 'ok',
            total: captures.length,
            data: captures
        }), { status: 200, headers });
        
    } catch(err) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: err.message 
        }), { status: 500, headers });
    }
        }
