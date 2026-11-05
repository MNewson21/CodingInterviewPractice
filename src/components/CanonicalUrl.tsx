import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE } from '../config/site';

/**
 * Keeps `<link rel="canonical">` pointing at the current route.
 *
 * This is managed here rather than hard-coded in index.html on purpose: the app is a
 * single-page app, so one static canonical would resolve to the same URL on every
 * route and tell crawlers that /revise, /tracks and the rest are all duplicates of
 * the home page. Driving it off the router instead gives each route its own.
 *
 * Search engines render JS before reading head tags, so a tag written here is seen.
 * Rendered inside BrowserRouter (it needs `useLocation`) and renders no markup.
 *
 * The query string and hash are excluded deliberately - no route varies its content
 * by either, so including them would just fragment one page into many URLs.
 */
export function CanonicalUrl() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Trailing slashes are stripped (except on the root) so /tracks and /tracks/
    // don't advertise themselves as two different canonical URLs.
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '';
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${SITE.url}${path}`;
  }, [pathname]);

  return null;
}
