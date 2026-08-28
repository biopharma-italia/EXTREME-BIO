// ============================================
// Bio-Clinic — Host canonicalization middleware
// ============================================
// bio-clinic.online e' un custom domain alias sullo stesso progetto
// Cloudflare Pages: ogni deploy pubblicava i contenuti anche su .online,
// causando duplicazione nell'indice Google (.online vs .it).
//
// Questo middleware forza un 301 path-to-path verso il dominio canonico:
//   https://bio-clinic.online/ginecologia/  -> https://bio-clinic.it/ginecologia/
//   (path + query string preservati; MAI redirect alla home)
//
// Host ammessi senza redirect:
//   - bio-clinic.it (dominio canonico di produzione)
//   - *.pages.dev  (deploy preview / branch deploy)
//   - localhost / 127.0.0.1 (wrangler pages dev)
//
// NB: la soluzione definitiva a livello zona (Redirect Rule su bio-clinic.online
// + rimozione del custom domain dal progetto Pages) va fatta dal dashboard
// Cloudflare; questo middleware garantisce il 301 da subito e resta come
// salvaguardia permanente.

const CANONICAL_HOST = 'bio-clinic.it';

function isAllowedHost(hostname) {
  const h = hostname.toLowerCase();
  return (
    h === CANONICAL_HOST ||
    h.endsWith('.pages.dev') ||
    h === 'localhost' ||
    h === '127.0.0.1'
  );
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (!isAllowedHost(url.hostname)) {
    // 301 path-to-path: preserva pathname + query string
    return Response.redirect(
      `https://${CANONICAL_HOST}${url.pathname}${url.search}`,
      301
    );
  }

  return context.next();
}
