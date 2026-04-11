/**
 * Normalizes text for search purposes.
 * 1. Converts to lowercase.
 * 2. Removes accents/diacritics using NFD normalization.
 * 3. Trims whitespace.
 * 
 * Example: "Lápices de Colores" -> "lapices de colores"
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Removes accents
    .trim();
}
