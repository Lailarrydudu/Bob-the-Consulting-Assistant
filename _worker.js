export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Normalize the path: remove trailing slash if present
    // This fixes the issue where '/api/chat/' wouldn't match '/api/chat'
    const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

    // Handle CORS preflight (for local testing or cross-origin usage)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Intercept requests to /api/chat
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const { messages, systemInstruction } = await request.json();
        
        // Verify API Key exists
        if (!env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in Cloudflare environment variables.");
        }

        // Call Gemini API
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction,
              contents: messages,
              // tools: [{ google_search: {} }], // Uncomment if you have Google Search enabled in Gemini
            }),
          }
        );
        
        const data = await geminiResponse.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
    
    // For all other requests, pass through to standard static assets
    return env.ASSETS.fetch(request);
  },
};
