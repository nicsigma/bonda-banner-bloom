export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-key');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Debug the request
  console.log('=== MAIN FLUX ROUTE DEBUG ===');
  console.log('Full request URL:', req.url);
  console.log('Request query:', req.query);
  console.log('This should only handle /api/flux, not /api/flux/*');
  console.log('=== END DEBUG ===');

  // Get the API key from environment variables
  const apiKey = process.env.VITE_FLUX_API_KEY || process.env.FLUX_API_KEY;
  
  if (!apiKey) {
    console.error('Flux API key not found in environment variables');
    return res.status(500).json({ 
      error: 'Flux API key not configured',
      details: 'API key not found in environment variables' 
    });
  }

  // This route should only handle direct /api/flux calls
  // But let's add fallback logic for debugging
  let targetUrl = '';
  
  // Check if this is a flux-pro-1.1 request that somehow ended up here
  if (req.url?.includes('flux-pro-1.1') || req.method === 'POST') {
    console.log('⚠️  Warning: flux-pro-1.1 request hit main route instead of dynamic route');
    targetUrl = 'https://api.bfl.ai/v1/flux-pro-1.1';
  } else {
    // Default fallback for other requests
    targetUrl = 'https://api.bfl.ai/v1/';
  }

  console.log(`Main route proxying request to: ${targetUrl}`);
  console.log(`Method: ${req.method}`);

  try {
    // Prepare headers for the Flux API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-key': apiKey,
    };

    // Prepare the request options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Add body for POST requests
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the request to the Flux API
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Flux API error:', response.status, response.statusText, data);
      return res.status(response.status).json({
        error: 'Flux API error',
        status: response.status,
        statusText: response.statusText,
        details: data
      });
    }

    // Forward the successful response
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 