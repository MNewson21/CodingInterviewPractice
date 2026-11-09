/**
 * Covers the canonical tag's actual contract: one tag, correct per route, updated
 * (not duplicated) on navigation. The regression worth guarding is a static
 * canonical that reports every SPA route as a duplicate of the home page.
 *
 * jsdom is opted into per-file, matching the convention in RunPanel.test.tsx.
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CanonicalUrl } from './CanonicalUrl';
import { SITE } from '../config/site';

/** Every canonical tag currently in the document head. */
function canonicals(): HTMLLinkElement[] {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CanonicalUrl />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  canonicals().forEach((l) => l.remove());
});

describe('CanonicalUrl', () => {
  it('points at the site root for /', () => {
    renderAt('/');
    // Asserted via `.href` (the resolved URL a crawler sees) rather than the raw
    // attribute: the DOM normalises a bare origin to carry a trailing slash, which
    // is the correct canonical form for a site root.
    expect(canonicals().map((l) => l.href)).toEqual([`${SITE.url}/`]);
  });

  it('gives a sub-route its own canonical rather than the home page', () => {
    renderAt('/revise');
    expect(canonicals()[0].href).toBe(`${SITE.url}/revise`);
  });

  it('keeps nested route segments', () => {
    renderAt('/tracks/blind-75');
    expect(canonicals()[0].href).toBe(`${SITE.url}/tracks/blind-75`);
  });

  it('strips a trailing slash so one page has one canonical URL', () => {
    renderAt('/tracks/');
    expect(canonicals()[0].href).toBe(`${SITE.url}/tracks`);
  });

  it('drops the query string and hash', () => {
    renderAt('/tracks?sort=hard#list');
    expect(canonicals()[0].href).toBe(`${SITE.url}/tracks`);
  });

  it('reuses the existing tag on navigation instead of appending another', () => {
    const { unmount } = renderAt('/about');
    expect(canonicals()).toHaveLength(1);
    unmount();

    renderAt('/privacy');
    const tags = canonicals();
    expect(tags).toHaveLength(1);
    expect(tags[0].href).toBe(`${SITE.url}/privacy`);
  });
});
