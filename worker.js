import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * Al-Quran API Showcase - Cloudflare Worker
 * Serves the static web application with proper headers and caching
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
  const url = new URL(request.url);
  
  try {
    // Handle static assets
    const response = await getAssetFromKV(event, {
      mapRequestToAsset: req => {
        const url = new URL(req.url);
        
        // Serve index.html for root path
        if (url.pathname === '/') {
          return new Request(`${url.origin}/index.html`, req);
        }
        
        return req;
      },
    });

    // Add security and performance headers
    const headers = new Headers(response.headers);
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy for Islamic content
    headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
      "font-src 'self' fonts.gstatic.com; " +
      "connect-src 'self' quran-api.asrulmunir.workers.dev; " +
      "img-src 'self' data:; " +
      "base-uri 'self';"
    );
    
    // Cache control based on file type
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes for HTML
    } else if (contentType.includes('text/css') || contentType.includes('application/javascript')) {
      headers.set('Cache-Control', 'public, max-age=86400'); // 1 day for CSS/JS
    } else {
      headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year for other assets
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
    
  } catch (e) {
    // Handle 404 and other errors
    if (e.message && e.message.includes('could not find')) {
      return new Response('Page not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'X-Content-Type-Options': 'nosniff',
        }
      });
    }
    
    console.error('Worker error:', e);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  }
}
