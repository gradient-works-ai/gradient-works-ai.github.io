import type { APIRoute } from 'astro';
import { nav, lab } from '../data/site';

// Public pages only: confirmation pages (/contact/thanks/, /lab/notified/) and 404 are left out on purpose.
const paths = ['/', ...nav.map((n) => n.href), ...lab.map((m) => `/lab/${m.slug}/`)];

export const GET: APIRoute = ({ site }) => {
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
