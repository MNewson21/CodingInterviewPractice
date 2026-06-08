import { useEffect } from 'react';
import { SITE } from '../config/site';

/**
 * Sets `document.title` to "<page> · CodingInterviewPractice" (or just the site name
 * when no page title is given). React Router doesn't manage the document title, so each
 * route calls this to give shared links and browser tabs a meaningful name.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.name}` : SITE.name;
  }, [title]);
}
