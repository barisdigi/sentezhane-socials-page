/**
 * Turn a kebab/snake slug like "gece-yarisi" into a display string
 * like "Gece Yarisi". Used as a fallback when an optional title is missing.
 */
export function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ');
}

/**
 * Returns the display title for an item with an optional `title` and
 * a required `slug`. Falls back to a humanized slug when title is empty.
 */
export function displayTitle(item: { title?: string; slug: string }): string {
  return item.title && item.title.length > 0 ? item.title : slugToTitle(item.slug);
}

/**
 * Normalizes bio text by collapsing whitespace and removing spaces before punctuation.
 */
export function normalizeBioText(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}
