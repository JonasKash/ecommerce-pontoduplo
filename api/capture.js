// api/capture.js
export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle pre-flight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabaseUrl = 'https://wfhlesxzmdibdtlkfona.supabase.co';
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseKey) {
        console.error('SUPABASE_SECRET_KEY is missing in environment variables');
        return res.status(500).json({ error: 'Configuração ausente: SUPABASE_SECRET_KEY não encontrada na Vercel.' });
    }

    try {
        const payload = req.body;

        // Filter out empty strings to prevent overwriting existing data with empty values during upsert
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );

        // Use the on_conflict query parameter to ensure we update the row by session_id
        const response = await fetch(`${supabaseUrl}/rest/v1/leads?on_conflict=session_id`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(cleanPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase API Error:', response.status, errorText);
            return res.status(response.status).json({ error: 'Supabase failure', details: errorText });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Capture API Exception:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
