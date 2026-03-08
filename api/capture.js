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

    try {
        const payload = req.body;

        // Filter out empty strings to prevent overwriting existing data with empty values during upsert
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );

        // Call Supabase REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates' // Requires a UNIQUE constraint on session_id in the database
            },
            body: JSON.stringify(cleanPayload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Supabase Error:', response.status, errorData);
            return res.status(response.status).json({ error: 'Failed to insert to Supabase' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('API Capture Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
