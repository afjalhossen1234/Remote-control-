export const config = { runtime: 'edge' };

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, headers 
        });
    }
    
    try {
        const { password } = await req.json();
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Afjal7380';
        
        if (password === ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ 
                status: 'ok', 
                token: ADMIN_PASSWORD 
            }), { status: 200, headers });
        } else {
            return new Response(JSON.stringify({ 
                status: 'error', 
                message: 'Invalid password' 
            }), { status: 401, headers });
        }
    } catch(err) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: err.message 
        }), { status: 500, headers });
    }
          }
