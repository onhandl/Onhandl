/**
 * Scrolls to the first element matching `selector` (e.g. `#features`).
 * @returns whether a matching element was found
 */
export function scrollToAnchorSelector(selector: string): boolean {
  if (!selector || selector === '#') return false;
  const el = document.querySelector(selector);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth' });
  return true;
}
