# Methodology — "The ledger"

A plain account of where every number on the site comes from, how it was computed, and what it does and does not mean. Nothing on the site is modeled or estimated except the two items explicitly labeled "derived" below.

## Sources

| Source | What it provides | Vintage |
|---|---|---|
| HUD National LIHTC Database | Project counts, units, states, credit type, construction type | Placed in service 1987–2024; database revised April 2026 |
| Joint Committee on Taxation, *Estimates of Federal Tax Expenditures* (JCX-45-25 and prior) | Federal revenue forgone (tax-expenditure estimates) | FY2025–2029, published Dec 2025; history back to 2005 |
| U.S. Treasury, Office of Tax Analysis, *Tax Expenditures FY2026* | Independent tax-expenditure estimate (cross-check) | FY2024–2034, published Nov 2024 |
| GAO-18-637 and GAO-24-107064 | Per-unit development cost, cost drivers, credit pricing | Projects completed 2011–2015, in 2015 dollars |
| IRS Rev. Proc. 2025-32; 26 U.S.C. § 42; P.L. 119-21 (OBBBA) | Credit ceiling, program mechanics, 2025 law changes | 2026 ceiling; statute current |
| HUD LIHTC tenant tables | Tenant income, rent, assistance, demographics | As of Dec 31, 2023 |

## How the HUD figures were computed

The full national database (`lihtcpub.zip`, ~29 MB) was downloaded from HUD and parsed directly. The workbook carries a legacy `sheetPr synchVertical` attribute that breaks standard readers; it was stripped from a copy before loading. The row count (55,345) and the "3.9 million units" headline were confirmed against HUD's own published totals.

- **Units by year** and **units by state** use HUD's cleaned fields `N_UNITSR` / `LI_UNITR` (which backfill missing values), and exclude the 2,765 projects whose placed-in-service year is uncoded (`8888`/`9999`).
- **Credit type** (9% vs 4%) uses the `CREDIT` field: code 2 = 70% present value = the "9%" credit; code 1 = 30% present value = the "4%" credit.
- **Construction type** uses the `TYPE` field.

## The two "derived" numbers

1. **~$1.17 billion in annual 9% credit authority (2026).** The IRS publishes a per-resident amount ($3.416) and a small-state floor ($3.95 million), not a national total. We multiply the per-resident amount by the Census 2025 U.S. population (~341.8 million). The true figure is somewhat higher because small states receive the fixed floor instead of the per-capita product, and it excludes returned/carryforward credit.
2. **~$11.7 billion in credit value over an award's life.** The annual authority above, times the 10-year claim period.

Both are labeled "derived" on the page.

## Deliberate choices and caveats

- **Tax-expenditure estimates are not spending.** They estimate revenue the Treasury forgoes, holding taxpayer behavior fixed, and are not the same as credits allocated or a repeal score. The site states this explicitly.
- **Per-unit cost comes from GAO's audited 2011–2015 sample, not from arithmetic on HUD's credit field.** HUD's `ALLOCAMT` field is populated for only ~64% of projects and contains clear errors (e.g. a single 8-unit project recorded with a $700 million annual credit). We therefore do not compute per-unit cost from it, and we flag the field wherever HUD credit data is discussed.
- **The most recent two to three years of unit counts are undercounts** and are shown in a distinct color; HUD keeps adding projects as agencies report them.
- **The database is a cumulative census of units placed in service since 1987, not the currently affordable stock.** Roughly a fifth of projects are flagged no longer monitored but remain in the file.
- **The 2023 tenant figures exclude California** (it did not report that year), so every national tenant statistic is California-free.
- **The tax-expenditure time series is not a clean annual series** — each JCT pamphlet re-forecasts under a new baseline and law.

## Reproducing

The derived JSON that drives the site lives in `data/`. The raw HUD download and the Python virtual environment are git-ignored; re-run the download from the HUD URL in the sources to regenerate. All primary-source URLs are listed in the site's "Sources & method" section.
