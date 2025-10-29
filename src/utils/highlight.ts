import DOMPurify from "dompurify";

// HTML sanitization config for highlighting - allows only safe tags and attributes needed for highlighting
const sanitizerConfig = {
  ALLOWED_TAGS: ["span", "mark"], // Only allow span and mark tags for highlighting
  ALLOWED_ATTR: ["class"], // Only allow class attribute for styling
};

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * @param html The HTML string to sanitize.
 * @returns Sanitized HTML string safe for insertion.
 */
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, sanitizerConfig);
}

/**
 * Highlights substrings in text based on match indices.
 * @param text The original text string.
 * @param indices Array of [start, end] index pairs from Fuse.js matches.
 * @returns The text with matches wrapped in <span> tags for highlighting (sanitized).
 */
export function highlightText(text: string, indices: number[][]): string {
  if (!indices || indices.length === 0) return text;

  // Sort indices in reverse order to avoid offset changes
  const sortedIndices = [...indices].sort((a, b) => b[0] - a[0]);

  const parts: string[] = [];
  let lastEnd = text.length;

  for (const [start, end] of sortedIndices) {
    if (start >= lastEnd || end > text.length) continue; // Invalid indices
    parts.unshift(text.substring(end, lastEnd));
    parts.unshift(`<span class="bg-info">${text.substring(start, end)}</span>`);
    lastEnd = start;
  }

  parts.unshift(text.substring(0, lastEnd));

  return sanitizeHTML(parts.join(""));
}

/**
 * Prepares a highlighted preview for markdown content.
 * Truncates the content to a reasonable length and highlights matches.
 * @param text The plain text version of markdown content (e.g., with markdown stripped).
 * @param indices Match indices from Fuse.js.
 * @param maxLength Max length for the preview.
 * @returns Highlighted and truncated string.
 */
export function getHighlightedPreview(
  text: string,
  indices: number[][],
  maxLength: number = 200
): string {
  if (!indices || indices.length === 0)
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;

  const highlighted = highlightText(text, indices);
  if (highlighted.length <= maxLength) return highlighted;

  // Truncate carefully: find a break point after highlighting
  // For simplicity, truncate the highlighted string, but better to calculate properly
  // Truncate the original text to maxLength, then highlight the truncated part
  const truncated = text.substring(0, maxLength);
  const truncatedIndices = indices.filter(([start]) => start < maxLength);
  return sanitizeHTML(highlightText(truncated + "...", truncatedIndices));
}

/**
 * Highlights all occurrences of search terms in the text.
 * Splits search by whitespace and highlights substrings case-insensitively.
 * @param text The original text string.
 * @param search The search string.
 * @returns The text with all matching substrings wrapped in <mark> tags.
 */
export function highlightSearchTerms(text: string, search: string): string {
  if (!search.trim()) return text;

  const words = search
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const escapedWords = words.map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Process replacements in reverse order to avoid offset issues
  let result = text;
  for (let i = escapedWords.length - 1; i >= 0; i--) {
    const escapedWord = escapedWords[i];
    const regex = new RegExp(`(${escapedWord})`, "gi");
    result = result.replace(regex, `<span class="bg-info">$1</span>`);
  }

  return sanitizeHTML(result);
}
