export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight (Allowed for all origins)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // ROBUST MATCHING: Check if the path contains '/api/chat' AND is a POST request
    // This prevents "405 Not Allowed" by ensuring the Worker catches the request
    if (url.pathname.includes('/api/chat') && request.method === 'POST') {
      try {
        // Verify API Key exists in Cloudflare Environment Variables
        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set in Cloudflare environment variables." }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
        }

        const { messages, systemInstruction } = await request.json();

        // Call Gemini API
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction,
              contents: messages, // Maps the incoming 'messages' to Gemini's 'contents'
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
    
    // Fallback: If it's not an API call, serve the website (index.html)
    return env.ASSETS.fetch(request);
  },
};
