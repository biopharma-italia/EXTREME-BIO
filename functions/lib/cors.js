/**
 * ============================================================================
 * BIO-CLINIC — CORS helper condiviso (API pubbliche booking/contact)
 * ============================================================================
 * Fix audit 2026-09-07 (P1.3): `Access-Control-Allow-Origin` accetta UN SOLO
 * valore — una lista separata da virgole è un header invalido che i browser
 * rifiutano. Qui la lista in env.ALLOWED_ORIGINS viene parsata e si risponde
 * con l'origin della richiesta solo se presente in whitelist, altrimenti col
 * primo origin consentito. `Vary: Origin` evita cache poisoning tra origini.
 *
 * @version 1.0.0 — 2026-09-08
 */

const FALLBACK_ORIGIN = 'https://bio-clinic.it';

/**
 * Restituisce il singolo origin da usare in Access-Control-Allow-Origin.
 * @param {Request|null} request - la richiesta (per leggere l'header Origin)
 * @param {object} env - env con ALLOWED_ORIGINS (lista separata da virgole)
 */
export function resolveAllowedOrigin(request, env) {
  const allowed = String(env?.ALLOWED_ORIGINS || FALLBACK_ORIGIN)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const requestOrigin = request?.headers?.get?.('Origin') || '';
  return allowed.includes(requestOrigin) ? requestOrigin : (allowed[0] || FALLBACK_ORIGIN);
}

/**
 * Header CORS base con origin singolo valido + Vary: Origin.
 * @param {Request|null} request
 * @param {object} env
 * @param {string} methods - es. 'POST, OPTIONS'
 * @param {string} allowHeaders - es. 'Content-Type, X-CSRF-Token'
 */
export function corsHeadersFor(request, env, methods = 'GET, POST, OPTIONS', allowHeaders = 'Content-Type') {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(request, env),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    'Vary': 'Origin',
  };
}
