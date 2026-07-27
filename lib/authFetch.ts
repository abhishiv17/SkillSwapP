/**
 * Authenticated fetch wrapper.
 * With cookie-based auth (@supabase/ssr), cookies are sent automatically
 * on same-origin requests. This wrapper just ensures proper Content-Type
 * headers for JSON payloads.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Ensure JSON content type for POST/PUT/PATCH/DELETE with body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}
