// Vercel Routing Middleware: runs before static files, so nothing below can be fetched by URL.
// - Private files (GrabAGun photo tokens, importer, config, dotfiles): always 404.
// - Export tools (/gunranking-export, /grabagun-export, /social-export, /tools/warm-photos): HTTP Basic Auth.
//   Set EXPORT_USER and EXPORT_PASS in Vercel → Settings → Environment Variables. If unset, they 404.
export const config = {
  matcher: [
    '/api/:path*', '/importer/:path*', '/.:path*',
    '/README.md', '/package.json', '/package-lock.json', '/netlify.toml', '/_redirects', '/vercel.json', '/middleware.js',
    '/gunranking-export', '/gunranking-export.html', '/grabagun-export', '/grabagun-export.html',
    '/social-export', '/social-export.html', '/tools/warm-photos', '/tools/warm-photos.html'
  ]
};

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
const EXPORTS = /^\/(gunranking-export|grabagun-export|social-export|tools\/warm-photos)(\.html)?$/;

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export default function middleware(request) {
  const p = new URL(request.url).pathname;
  if (p.startsWith('/api/')) return p === '/api/img' ? undefined : notFound();
  if (EXPORTS.test(p)) {
    const u = process.env.EXPORT_USER, pw = process.env.EXPORT_PASS;
    if (!u || !pw) return notFound();
    const h = request.headers.get('authorization') || '';
    let given = '';
    try { given = h.startsWith('Basic ') ? atob(h.slice(6)) : ''; } catch (e) {}
    if (safeEqual(given, u + ':' + pw)) return undefined;
    return new Response('Authentication required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="GunRanking tools"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return notFound();
}
