import type { APIRoute } from 'astro';

// Generated so the sitemap URL follows `site` in astro.config.mjs (e.g. after moving to a custom domain).
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`, { headers: { 'Content-Type': 'text/plain' } });
