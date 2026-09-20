# Patch 2 — Selar button on 6 book cards

File: `public/index.html` — `#books` grid. Each card's button row currently is:
```html
<a class="book-link" href="https://bidmoh.gumroad.com/l/{GUMROAD_ID}" target="_blank">Buy on Gumroad</a>
<a class="book-link" href="https://payhip.com/b/{PAYHIP_ID}" target="_blank">Buy on Payhip</a>
```

Insert, immediately **before** the Gumroad link, on the 6 cards listed below (identify
the right card by its Gumroad permalink — verified live this session):

```html
<a class="book-link" href="https://selar.com/m/bid-moh1" target="_blank" rel="noopener">🛒 Buy on Selar</a>
```

| Book | Gumroad permalink | Payhip permalink | Add Selar? |
|---|---|---|---|
| UNSHAKEABLE | `/l/hsyzy` | `/b/6rI2N` | ✅ |
| The Discipline Blueprint | `/l/hbaobz` | `/b/I3dgP` | ✅ |
| The Focus Protocol | `/l/pgyglc` | `/b/Lbi94` | ✅ |
| Quiet the Noise | `/l/okdbi` | `/b/fDZjz` | ✅ |
| ChatGPT for Students | `/l/ngrex` | `/b/wesxE` | ✅ |
| The Bottom Transcript | `/l/pkulg` | `/b/U7xKz` | ✅ |
| The Identity Shift | `/l/rzrrm` | `/b/h67zi` | ❌ not on Selar — skip |

Uses the existing `.book-link` class, so it inherits the current button styling
automatically. Selar links to the store homepage (`selar.com/m/bid-moh1`) rather than
a per-product URL, since Selar's storefront has no stable per-product links to verify
against.

Status: ready — hrefs verified live this session (`Buy on Gumroad`/`Buy on Payhip`
targets re-confirmed working).
