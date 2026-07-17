# The ledger — what the LIHTC costs and what it buys

A carefully sourced, single-page explainer on the federal Low-Income Housing Tax Credit: its cost to the Treasury and the housing it produces. Every figure is drawn from a primary federal source (HUD, IRS, the Joint Committee on Taxation, GAO) and cross-checked.

Static site — no build step. `public/` contains `index.html`, `style.css`, `app.js` and the derived data in `public/data/`. Charts are hand-rolled inline SVG (no external chart library).

## Run locally

```
python3 -m http.server 5501 --directory public
```

Then open http://localhost:5501.

## Sources & method

See [METHODOLOGY.md](METHODOLOGY.md). The raw HUD database and the analysis virtual environment are git-ignored; the small derived JSON that powers the page is committed under `public/data/`.
