exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { url } = JSON.parse(event.body);
    if (!url) throw new Error('No URL provided');

    // Server-side fetch to Jina — no CORS issues
    const jinaUrl = 'https://r.jina.ai/' + url;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; VANTAGE/1.0)'
      },
      // 8 second timeout
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error('Jina fetch failed: ' + response.status);
    }

    const text = await response.text();
    const content = text.substring(0, 8000);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content, success: true })
    };

  } catch (err) {
    // Return graceful fallback — don't fail the whole flow
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: null, success: false, error: err.message })
    };
  }
};
