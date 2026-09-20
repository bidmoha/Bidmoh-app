# bidmoh-site — local project scaffold

## What this is
A `wrangler.jsonc` project scaffold matching the live `bidmoh` Worker's structure
(Workers with Static Assets, `env.ASSETS.fetch(request)`), plus the 3 Selar patches
written up as exact, verified find/replace instructions in `patches/`.

## What this is NOT
Not a byte-for-byte crawl of the live site. Two real limits, disclosed rather than
worked around:

1. **Raw HTML/CSS extraction was blocked at the tool level this session.** Every
   attempt to pull a full page's raw HTML (even just the first few KB) through the
   browser-automation tool was blocked by a content filter, on every page tested —
   homepage and article pages alike. Small, structured queries (specific text, specific
   links, specific classes) worked fine and are what the patches above are built from,
   but a full raw dump of `public/index.html` or the ~26 blog article pages wasn't
   something I could pull this way.
2. **The 2 target articles' bodies aren't reproduced here.** Each is several paragraphs
   of Bid's original writing; copying full articles into a new repo isn't something I
   should do just to stage a one-sentence edit. `patches/03-article-mentions.md` has
   the exact before/after text for the sentences that actually change — the rest of
   each article is unchanged and should be copied from the live page directly (view
   source, or however the real deploy pipeline pulls current content) rather than
   retyped here.

`public/` is currently just a placeholder — see `public/index.html`.

## Before deploying this anywhere
This project is for **reviewing the 3 patches**, not for `wrangler deploy`. Because
`public/` isn't a verified complete copy of the live site, deploying it as-is would
overwrite the real homepage/articles/CSS/images with an incomplete stand-in. Confirmed
separately (Cloudflare deployment history): the live `bidmoh` Worker has never been
deployed via Wrangler — every version shows "Manually deployed" via the Cloudflare
dashboard. There's no evidence a local wrangler project was ever the source of truth,
so this scaffold is new, not a recovery of something that existed before.

**Recommended real path:** apply the 3 patches directly in the Cloudflare dashboard
(Workers & Pages → bidmoh → Quick Edit for the static assets it serves, or the
equivalent asset-upload flow), using the exact text in `patches/`. That edits the real
current content in place instead of risking a partial overwrite from this scaffold.

## Files
- `wrangler.jsonc` — points at `./public` as the Worker's static assets, `src/index.js`
  as the passthrough script (matches the live Worker's own code, already confirmed).
- `patches/01-hero-text.md` — homepage hero card wording.
- `patches/02-book-cards-selar.md` — Selar button + verified Gumroad/Payhip permalinks
  for the 6 eligible books (Identity Shift excluded — not sold on Selar).
- `patches/03-article-mentions.md` — the 2 article edits.
