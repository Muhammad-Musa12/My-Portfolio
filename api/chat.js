// api/chat.js - This runs securely on Vercel/Netlify.
const fetch = require('node-fetch');

// 1. **GET THE SECRET KEY:** This key is set on the Vercel/Netlify dashboard and is NOT visible to users.
const API_KEY = process.env.GEMINI_API_KEY; 

// The static endpoint for the Gemini API call.
const CHAT_MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// This is the function the hosting platform executes when your frontend calls /api/chat
module.exports = async (req, res) => {
    // Standard headers for web security (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // Handle preflight requests
    }
    
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed.');
    }
    
    if (!API_KEY) {
        return res.status(500).send('Server Error: GEMINI_API_KEY environment variable not configured.');
    }

    try {
        // req.body contains the chat history and prompt sent from your browser
        const payload = req.body;

        // 2. **MAKE THE SECURE CALL:** The key is added here, on the private server environment.
        const response = await fetch(`${CHAT_MODEL_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            console.error('Gemini API Error:', response.status, errorBody);
            // Forward the error status back to the client for debugging
            return res.status(response.status).json({ error: 'External API call failed', details: errorBody });
        }

        // 3. **SEND RESULT BACK:** Forward the successful AI response to the user's browser
        const result = await response.json();
        res.status(200).json(result);

    } catch (error) {
        console.error('Proxy Function Error:', error);
        res.status(500).send('Internal Serverless Proxy Error.');
    }
};
