function getBrowserApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  const explicit = window.__APM_API_BASE_URL__ || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit) return String(explicit).replace(/\/+$/, '');
  return '';
}

export async function fetchJson(route, options = {}) {
  const baseUrl = getBrowserApiBaseUrl();
  const target = `${baseUrl}${route}`;
  const response = await fetch(target, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let body = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      (body && typeof body === 'object' && body.error) || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}
