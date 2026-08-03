# Lord Walker — React + Framer Motion

This is the React migration of the vanilla site, keeping the exact same editorial
visual identity and talking to the exact same backend (`https://lordwalker-store.onrender.com`)
— no backend changes needed at all.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (this is what gets deployed)
npm run lint
```

Deploys to Vercel the same way any Vite app does — connect the repo, framework preset
"Vite", no config needed.

## What's done and verified

- Project builds clean (`npm run build`) and lints clean (`npm run lint` — 0 errors, a
  handful of harmless Fast-Refresh hints).
- **Home page** — every section, fully built: hero, "In This Issue" index, product rows,
  the About feature story with drop cap, the diabetic-care spread, the Men/Women/Kids
  chapters, reviews, further reading, contact/subscribe, closing image.
- **Shop page** — real filtering by purpose/wearer/sock length via URL params, plus
  cross-page search.
- **Cart + Checkout** — ported line-for-line from the working vanilla logic: the
  bundle-discount/free-shipping quote system (with the same stale-response guard), and
  the full Razorpay flow (create order → open checkout → verify payment).
- Header (masthead + animated mobile menu), footer, product modal, size guide modal,
  toast notifications — all rebuilt with Framer Motion replacing the old
  IntersectionObserver-based reveal animations.

## What's still a placeholder

Gifting, Why Lord Walker, the 3 blog posts, and the 5 policy pages all show a clearly
labeled "Coming Next" screen rather than your real content — Home and Shop were
prioritized since nearly everything links through them. Porting the rest is
straightforward (same pattern as ShopPage.jsx) but wasn't done in this pass.

## Please actually test before this goes live

I wrote and built this carefully, but I have no browser here to click through it —
`npm run build` succeeding tells you the code is syntactically sound, not that the
checkout flow works end to end. **Before this replaces your live site, personally run
a real test purchase** with your Razorpay test keys:

1. Add a product to cart, confirm the quote/shipping math matches what the vanilla
   site shows for the same cart.
2. Go through checkout with a Razorpay test card.
3. Confirm the success and cancel/dismiss paths both behave — I added a modal
   `ondismiss` handler that the original didn't need (see note below), specifically so
   closing the payment popup doesn't leave the button stuck on "Processing…" forever.

## One deliberate change from the original

`checkout()` now returns a Promise (so the "Processing…" button state can await it
cleanly). The original vanilla version didn't need a dismiss handler because it was
fire-and-forget; this version does, or a cancelled payment would hang the UI. This is
the only behavioral change in the payment code — everything else is a direct port.
