/* global fetch, FormData */
// front/src/utils/api.js
/**
 * fetchJson - robust wrapper around fetch used in the app.
 *
 * - tries original URL, and if 404 attempts the alternative (/api/ <-> /apip/)
 * - adds Accept and appropriate Content-Type for requests with a body
 * - stringifies object bodies automatically
 * - parses JSON responses when possible, returns raw text otherwise
 * - returns null for empty response bodies (204)
 *
 * Usage: await fetchJson('/api/characters/1', { method: 'GET', headers: { Authorization: 'Bearer ...' } })
 */

function buildHeaders(userHeaders = {}, hasBody = false, method = 'GET') {
  const hdr = {
    Accept: 'application/ld+json, application/json, */*',
    ...userHeaders,
  };

  // Only add Content-Type when we send a body and when it's not already set.
  // Normalize keys to detect existing Content-Type (case-insensitive).
  const lowerKeys = Object.keys(hdr).reduce((acc, k) => {
    acc[k.toLowerCase()] = hdr[k];
    return acc;
  }, {});

  if (hasBody && !('content-type' in lowerKeys)) {
    // Prefer merge-patch for PATCH, else ld+json for others (API Platform typical)
    if (String(method).toUpperCase() === 'PATCH') {
      hdr['Content-Type'] = 'application/merge-patch+json';
    } else {
      hdr['Content-Type'] = 'application/ld+json';
    }
  }

  return hdr;
}

export async function fetchJson(origUrl, opts = {}) {
  // normalize opts
  const options = { method: (opts.method ?? 'GET').toUpperCase(), ...opts };

  // If a body is provided and is an object (not a string / FormData), stringify it.
  let bodyToSend = options.body;
  const hasBody = typeof bodyToSend !== 'undefined' && bodyToSend !== null;
  if (hasBody && typeof bodyToSend !== 'string' && !(bodyToSend instanceof FormData)) {
    try {
      bodyToSend = JSON.stringify(bodyToSend);
    } catch {
      // leave as-is; fetch will probably fail but we avoid crashing here
    }
  }

  const tryFetch = async (url, optionsForTry) => {
    const headers = buildHeaders(optionsForTry.headers || {}, hasBody, optionsForTry.method);
    const fetchOpts = {
      ...optionsForTry,
      headers,
      // Replace body with possibly stringified version (but don't set body for GET/HEAD)
      ...(hasBody && !['GET', 'HEAD'].includes(String(optionsForTry.method).toUpperCase())
        ? { body: bodyToSend }
        : {}),
    };

    const resp = await fetch(url, fetchOpts);

    // Try to read text (works even if no body)
    const text = await resp.text();

    // No content (204) -> return null
    if (!text || text.length === 0) {
      if (resp.ok) return null;
      // still build friendly error for non-ok empty responses
    }

    // Try to parse JSON if the response looks like JSON (Content-Type header contains json)
    const contentType = resp.headers.get('content-type') || '';
    let parsed = null;
    if (
      contentType.includes('json') ||
      String(text).trim().startsWith('{') ||
      String(text).trim().startsWith('[')
    ) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // parsing failed, keep raw text
        parsed = text;
      }
    } else {
      // not JSON
      parsed = text;
    }

    if (resp.ok) {
      return parsed;
    }

    // Build friendly errors similar to your previous behavior
    const status = resp.status;
    if (status === 401) {
      const err = new Error('Unauthorized (JWT Token missing or invalid)');
      err.status = 401;
      err.body = parsed;
      throw err;
    }
    if (status === 404) {
      const err = new Error('Not found');
      err.status = 404;
      err.body = parsed;
      throw err;
    }
    const message = (parsed && (parsed.message || parsed.error)) || `HTTP ${status}`;
    const err = new Error(message);
    err.status = status;
    err.body = parsed;
    throw err;
  };

  // First attempt origUrl, then fallback swapping /api/ <-> /apip/ on 404
  try {
    return await tryFetch(origUrl, options);
  } catch (err) {
    // Only try fallback for 404 (or when no status provided — route missing)
    if (err && err.status !== 404 && typeof err.status !== 'undefined') throw err;

    // compute alternate
    let alt = null;
    if (origUrl.startsWith('/api/')) {
      alt = origUrl.replace(/^\/api\//, '/apip/');
    } else if (origUrl.startsWith('/apip/')) {
      alt = origUrl.replace(/^\/apip\//, '/api/');
    } else {
      alt = '/apip' + (origUrl.startsWith('/') ? origUrl : '/' + origUrl);
    }

    try {
      return await tryFetch(alt, options);
    } catch (err2) {
      // if fallback failed, rethrow the fallback error or original
      throw err2.status ? err2 : err;
    }
  }
}
