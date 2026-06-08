/**
 * Single source of truth for site-wide identity used across SEO tags, the footer,
 * and the privacy notice.
 *
 * If the live domain changes, update `domain`/`url`/`email` here AND the matching
 * absolute URLs in `index.html` (static HTML can't import this module).
 */
export const SITE = {
  name: 'CodingInterviewPractice',
  tagline:
    'A mock coding-interview IDE - practise problems, get AI feedback that talks through your approach, and replay your attempts.',
  author: 'Miles Newson',
  domain: 'codinginterviewpractice.dev',
  url: 'https://codinginterviewpractice.dev',
  email: 'enquiries@codinginterviewpractice.dev',
  github: 'https://github.com/MNewson21',
} as const;
