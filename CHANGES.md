# What changed, and why

Three things were asked for: don't make it look AI-generated, improve the images, make it more efficient. Here's what was done for each, concretely.

## 1. Images — 72% smaller, same 24 files down to 21

| | Before | After |
|---|---|---|
| Total payload | 5,317 KB | 1,481 KB |

- Every JPEG converted to WebP, resized to what its actual on-screen size needs (with retina headroom), quality-tuned per content type (88 for the logo's fine linework, 78–82 for photos).
- `wearer-tile-kids.jpg`, `wearer-tile-men.jpg`, `wearer-tile-women.jpg` deleted — confirmed zero references anywhere in the codebase, pure dead weight.
- `loading="lazy" decoding="async"` added to every image below the fold, on every page. Hero/banner images stay eager (they're the first thing visible, so lazy-loading them would only slow perceived load).
- A real, visually-hidden `<h1>` was added to the homepage — it had none. The hero headline is baked into the carousel photos, which is fine visually but invisible to screen readers and search engines. Same fix pattern used for gifting/why-lord-walker's already-present headings.

## 2. Visual design — grounded in your own brand instead of a generic look

The old palette (lilac/violet/sky/rose pastel washes, blurred gradient "blob" shapes behind the hero, rainbow-gradient tiles in the nav dropdown) is the exact look of an AI-tool demo, and it was working against your own copy — *"Premium, Without Excess... no unnecessary gimmicks."*

- New palette pulled from your own crest logo: warm ink, cream paper, aged brass/gold, deep pine green. No pastels, no blobs.
- Mega-menu and mobile drawer tiles: flat, calm, on-brand — not a rainbow gradient grid.
- Body typeface swapped from Inter to Libre Franklin — Fraunces (display) and IBM Plex Mono (labels) were already good, distinctive choices, so those stayed.
- One signature element, used sparingly: a knit-rib texture (echoing "every seam, rib, and stitch" — your own copy) as a divider near the hero and footer, instead of the generic blob decoration.
- **Every page now has the same real header (mega-menu, search, cart) and footer.** Before, only the homepage had them — shop.html and every other page had just a "← Back to site" link. That inconsistency read as disconnected, generated-in-pieces rather than one considered site.

## 3. Efficiency — one stylesheet and one script instead of 11 copies

- All CSS extracted from 11 duplicate inline `<style>` blocks (index.html's alone was 40KB) into one shared `styles.css`. This also fixed real drift that had already crept in — shop.html was missing 7 of the 15 color variables index.html defined.
- Shared navigation behavior (mega-menu, mobile drawer, search toggle, scroll animations, toast messages) extracted into `nav.js`, used by every page instead of being copy-pasted.
- Cross-page search now actually works: search from any page and it lands on the shop with your query pre-filled (`index.html?search=...`), rather than just dropping you on the shop section.

## Things worth knowing, not fixed here (out of scope for this pass)

- **The cart is in-memory only** (no localStorage), so it resets on page navigation — this predates these changes. shop.html's cart/search icons now send you to the homepage cart, the same pattern the original `quickAdd()` already used, so nothing is newly broken, but true cross-page cart persistence would need real changes to the checkout/payment flow, which felt like the wrong thing to touch in a pass about design and assets.
- **Your product catalog has no real photos yet** — every product card currently falls back to a plain sock icon, because `products.seed.json` has no image data. Once real product photography exists, run it through the same resize/WebP process used here before uploading via the admin panel (payloads are base64 in the JSON DB right now, so unoptimized photos will bloat every API response).
- **The reviews are still placeholder** and the size chart is still placeholder — both already flagged as such in your own copy. Not an images/design/efficiency item, but easy to miss.
- The hero carousel still loads all 4 background images up front (not lazy) since they're CSS `background-image`, not `<img>` tags — restructuring that touches the carousel's JS timing logic, so it was left alone to avoid risking the working autoplay/dot navigation for a modest gain now that the images themselves are much smaller.

## Files

- `styles.css`, `nav.js` — new, shared by every page
- All 12 customer-facing `.html` files — updated
- `admin.html` — untouched (internal tool, out of scope)
- Backend (`server.js`, `routes/`, `db.js`, etc.) — untouched
