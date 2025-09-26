/* global fetch */
//
// front/src/utils/api.js
/**
 * fetchJson
 * - tente l'URL fournie en premier lieu,
 * - si 404 (route non trouvée) tente automatiquement l'URL alternative :
 *   si url commence par /api/ => teste /apip/... ; si /apip/ => teste /api/...
 * - construit des erreurs lisibles (401 -> Unauthorized, 422 -> validation, etc.)
 *
 * Usage: await fetchJson('/api/characters/1', { method: 'GET', headers: { Authorization: 'Bearer ...' } })
 */

export async function fetchJson(origUrl, opts = {}) {
  const tryFetch = async (url, options) => {
    const headers = {
      Accept: 'application/json, application/ld+json;q=0.9',
      ...(options.headers || {}),
    };
    const resp = await fetch(url, { ...options, headers });
    const text = await resp.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (resp.ok) {
      return body;
    }

    // build friendly errors
    const status = resp.status;
    if (status === 401) {
      const err = new Error('Unauthorized (JWT Token missing or invalid)');
      err.status = 401;
      err.body = body;
      throw err;
    }
    if (status === 404) {
      const err = new Error('Not found');
      err.status = 404;
      err.body = body;
      throw err;
    }
    // validation / other
    const message = (body && (body.message || body.error)) || `HTTP ${status}`;
    const err = new Error(message);
    err.status = status;
    err.body = body;
    throw err;
  };

  // try original url, and fallback swapping /api/ <-> /apip/
  try {
    return await tryFetch(origUrl, opts);
  } catch (err) {
    // only try fallback for 404 or when route missing
    if (err.status !== 404 && err.status !== undefined) throw err;

    // compute alternate
    let alt = null;
    if (origUrl.startsWith('/api/')) {
      alt = origUrl.replace(/^\/api\//, '/apip/');
    } else if (origUrl.startsWith('/apip/')) {
      alt = origUrl.replace(/^\/apip\//, '/api/');
    } else {
      // not a prefixed path: try both
      alt = '/apip' + (origUrl.startsWith('/') ? origUrl : '/' + origUrl);
    }

    try {
      return await tryFetch(alt, opts);
    } catch (err2) {
      // if fallback failed, rethrow the original or the fallback error
      throw err2.status ? err2 : err;
    }
  }
}
