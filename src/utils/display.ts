// Display helpers for cafe tags and price brackets

/**
 * Converts a tag like 'laptop_friendly' to 'Laptop friendly'.
 * Optionally, you can pass a translation function.
 */
export function displayCafeTag(tag: string, t?: (key: string) => string): string {
  if (t) {
    // Try translation first
    const translated = t(`cafeTag.${tag}`);
    if (translated && translated !== `cafeTag.${tag}`) return translated;
  }
  return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Converts a price bracket like 'low' to 'Low', 'mid' to 'Mid', etc.
 * Optionally, you can pass a translation function.
 */
export function displayPriceBracket(bracket: string, t?: (key: string) => string): string {
  if (t) {
    const translated = t(`priceBracket.${bracket}`);
    if (translated && translated !== `priceBracket.${bracket}`) return translated;
  }
  switch (bracket) {
    case 'low': return 'Low';
    case 'mid': return 'Mid';
    case 'high': return 'High';
    default: return bracket.charAt(0).toUpperCase() + bracket.slice(1);
  }
} 