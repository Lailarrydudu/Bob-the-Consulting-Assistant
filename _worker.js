export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          // WE ADDED 'Authorization' TO THE LIST BELOW:
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        },
      });
    }
    
    if (url.pathname.includes('/api/chat') && request.method === 'POST') {
      try {
        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set." }), { status: 500 });
        }

        const { messages, systemInstruction } = await request.json();

        // 1. Define the Google Search Tool
        const tools = [{ google_search: {} }];

        // 2. Call Gemini 1.5 Flash-002 (Specific version that supports tools better)
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction,
              contents: messages,
              tools: tools 
            }),
          }
        );
        
        const data = await geminiResponse.json();
        
        // Check for API errors (like model not found or quota)
        if (data.error) {
             return new Response(JSON.stringify(data), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
             });
        }
        
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
              'Access-Control-Allow-Origin': '*' 
          },
        });
      }
    }
    
    return env.ASSETS.fetch(request);
  },
};
