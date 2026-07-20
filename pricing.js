// Centralized pricing rules — Phase 1 growth roadmap items.
// Keeping this in one file means the server is always the source of truth
// for prices; the frontend calls the SAME logic (via /api/cart/quote) purely
// to render numbers, and never sends its own totals to be trusted.

const FREE_SHIPPING_THRESHOLD = 499; // ₹ — free shipping at/above this subtotal
const FLAT_SHIPPING_FEE = 49;        // ₹ — charged below the threshold

const BUNDLE_BUY = 3;   // buy 3 single-pair items...
const BUNDLE_FREE = 1;  // ...get the cheapest 1 free (i.e. every 4th unit)
const BUNDLE_GROUP_SIZE = BUNDLE_BUY + BUNDLE_FREE;

// A product counts toward the "Buy 3 Get 1" bundle only if it's a single-pair
// item, not a combo pack (combo packs already have their own bundle pricing
// baked into the price). We detect combo packs by id/name pattern.
function isSinglePairProduct(product) {
  const hay = `${product.id} ${product.name}`.toLowerCase();
  return !/(pack of|pcs|combo)/.test(hay);
}

/**
 * @param {Array<{product: object, qty: number}>} lines - resolved product + qty
 * @returns {{subtotal:number, bundleDiscount:number, shipping:number, total:number, freeUnits:number}}
 */
function quote(lines) {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  // Flatten single-pair units into a price array, cheapest first
  const singleUnitPrices = [];
  for (const l of lines) {
    if (isSinglePairProduct(l.product)) {
      for (let i = 0; i < l.qty; i++) singleUnitPrices.push(l.product.price);
    }
  }
  singleUnitPrices.sort((a, b) => a - b);

  const freeUnits = Math.floor(singleUnitPrices.length / BUNDLE_GROUP_SIZE) * BUNDLE_FREE;
  const bundleDiscount = singleUnitPrices.slice(0, freeUnits).reduce((s, p) => s + p, 0);

  const afterDiscount = subtotal - bundleDiscount;
  const shipping = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = afterDiscount + shipping;

  return { subtotal, bundleDiscount, shipping, total, freeUnits };
}

module.exports = {
  quote,
  isSinglePairProduct,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_FEE,
  BUNDLE_BUY,
  BUNDLE_FREE,
  BUNDLE_GROUP_SIZE,
};
