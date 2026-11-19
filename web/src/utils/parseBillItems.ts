/**
 * Helper to parse multi-product descriptions into distinct line items.
 * Handles formats like:
 * "Mixture Pack 500g (10x₹120) + Besan Laddu 250g (5x₹85)"
 * or standard single products like:
 * "Mixture Pack 500g"
 */
export interface ParsedBillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function parseBillProductItems(
  productStr: string,
  fallbackQty: number,
  fallbackPrice: number,
  fallbackTotal: number
): ParsedBillItem[] {
  if (!productStr || !productStr.includes(' + ')) {
    // Single item
    const singleMatch = productStr?.match(/^(.*?)\s*\(([0-9]+)\s*x\s*₹?([0-9.]+)\)$/i);
    if (singleMatch) {
      const qty = parseInt(singleMatch[2], 10) || fallbackQty;
      const price = parseFloat(singleMatch[3]) || fallbackPrice;
      return [
        {
          name: singleMatch[1].trim(),
          quantity: qty,
          unitPrice: price,
          total: qty * price,
        },
      ];
    }
    return [
      {
        name: productStr || 'Product Pack',
        quantity: fallbackQty,
        unitPrice: fallbackPrice,
        total: fallbackTotal,
      },
    ];
  }

  // Multi-item separated by " + "
  const parts = productStr.split(' + ');
  const items: ParsedBillItem[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Pattern: "ProductName (10x₹120)" or "ProductName (10x120)"
    const match = trimmed.match(/^(.*?)\s*\(([0-9]+)\s*x\s*₹?([0-9.]+)\)$/i);
    if (match) {
      const name = match[1].trim();
      const qty = parseInt(match[2], 10) || 1;
      const price = parseFloat(match[3]) || 0;
      items.push({
        name,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
      });
    } else {
      items.push({
        name: trimmed,
        quantity: 1,
        unitPrice: fallbackPrice,
        total: fallbackPrice,
      });
    }
  }

  return items.length > 0
    ? items
    : [
        {
          name: productStr,
          quantity: fallbackQty,
          unitPrice: fallbackPrice,
          total: fallbackTotal,
        },
      ];
}
