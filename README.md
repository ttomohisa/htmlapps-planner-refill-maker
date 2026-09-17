# Planner Refill Maker / システム手帳リフィルメーカー

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-planner-refill-maker/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-planner-refill-maker/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-planner-refill-maker/)

[日本語版 README](README.ja.md)

A single-HTML planner refill generator for A5, Bible, Mini 6, Micro5, HB×WA5, Davinci Pocket, and custom sizes. It creates dated and note-paper layouts in the browser and exports exact-size or imposed PDFs without sending planner settings or generated content to an external server.

## 🚀 Live demo

### [Open Planner Refill Maker on GitHub Pages](https://ttomohisa.github.io/htmlapps-planner-refill-maker/)

GitHub Pages delivers the initial HTML. After it loads, calendar generation, previews, layout calculation, and PDF creation are processed locally on your device.

[![Planner Refill Maker screenshot](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-planner-refill-maker/)

## Features

- **Planner sizes that match real paper** — A5, Bible, Mini 6, Davinci Pocket, Micro5, HB×WA5, portrait / landscape, and custom dimensions.
- **Monthly, yearly, weekly, daily, and notes** — Monthly one-page / spread, yearly one-page / spread, weekly block / weekly + notes / vertical, daily, ruled, grid, and dot-grid refills.
- **Monthly spread built for facing pages** — Equal-size day cells across both pages, with month/year and previous/next mini calendars on the left page.
- **Japanese holiday support** — Bundled verified 2026–2027 holiday data, separate Saturday / Sunday / holiday colors, and optional holiday names.
- **Print-focused appearance controls** — Minimal / Classic / Tight Margins, monochrome / accent output, five text-size levels, ruling weight, page numbers, and week numbers.
- **Ring-side layout handling** — Automatic or manual ring margin, mirrored left/right pages, first-page side selection, and optional punch-position guides.
- **Exact-size and imposed PDF export** — Save the refill at its physical dimensions, or place full-size refills on A4 / US Letter without scaling.
- **Duplex and finishing options** — Single-sided / long-edge / short-edge output, crop guides, front/back placement preview, and blank final backs when required.
- **Print-size test PDF** — Includes a 100 mm reference line and 50 × 50 mm box for checking printer scaling.
- **Local single-HTML operation** — Japanese / English UI, desktop / smartphone layout, local settings persistence, and no runtime API/CDN requests.

## Quick start

### Use the web demo

Open the [GitHub Pages demo](https://ttomohisa.github.io/htmlapps-planner-refill-maker/). No account or installation is required.

### Use the single HTML file

1. Download `dist/index.html` from this repository.
2. Open it in a current Chrome, Edge, Firefox, or Safari.
3. Choose a refill size and layout, then create the PDF.

`dist/index.html` is designed to work directly from `file://`.

## Usage

1. Choose the physical planner size and portrait / landscape orientation.
2. Select Monthly, Yearly, Weekly, Daily, or Notes, then choose its layout.
3. Set the date range or note-page count. Weekly Vertical and Daily also let you set the time range.
4. Choose Monday / Sunday week start and optionally show adjacent-month dates.
5. Enable bundled Japanese holidays if needed. Adjust colors, style, text size, rules, page numbers, or week numbers under **Appearance**.
6. Keep the automatic ring-side margin or set a manual 4–30 mm margin. For one-page layouts, choose the first page side.
7. Inspect the preview. Monthly Spread uses the same Canvas page renderer as PDF output to reduce preview/export drift.
8. Choose **Exact refill size**, **A4**, or **US Letter**. A4 / Letter keeps the refill at full physical size and automatically selects paper orientation / placement.
9. Choose Single-sided, Long-edge flip, or Short-edge flip, and enable crop guides when needed.
10. Create the PDF, then save it locally.

When printing, choose **100% / Actual size** and do not use **Fit to page**.

## Publish with GitHub Pages

The repository includes a GitHub Pages workflow.

1. Push the repository to GitHub as `htmlapps-planner-refill-maker`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or run the Pages workflow manually from Actions.
4. The app is then available at `https://ttomohisa.github.io/htmlapps-planner-refill-maker/`.

## Development and build layout

```text
.
├─ src/index.template.html       # Application template
├─ app.config.json               # App metadata and build settings
├─ assets/
│  ├─ favicon.svg
│  ├─ screenshot.png
│  └─ screenshot-en.png
├─ tests/                        # Contract / regression tests
├─ scripts/                      # Repository checks and builders
├─ build-standalone.bat          # Windows build entry point
├─ build-standalone.ps1          # Single-HTML builder
└─ dist/
   ├─ index.html
   └─ index.self-extract.html
```

Build on Windows:

```powershell
.\build-standalone.bat
```

Repository checks:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Do not edit generated files in `dist/` directly.

## Privacy and runtime network protection

Planner settings, calendar generation, preview rendering, and PDF creation are processed locally in the browser.

The generated app includes a Content Security Policy with `connect-src 'none'`. It does not require a runtime API or CDN. Settings that are remembered are stored in browser local storage.

The GitHub Pages version still requires the initial HTML request. For use with the network disconnected, open `dist/index.html` locally.

## Limitations

- Bundled Japanese holiday data covers **2026 and 2027 only**. Dates outside bundled coverage are intentionally not guessed.
- Punch-position guides are alignment references and do not guarantee a binder manufacturer's exact hole positions.
- Supported date input is January 1900 through December 2100, with a maximum selected range of 60 months.
- Very large date ranges, high PDF raster DPI, or constrained mobile devices can require substantial memory during PDF generation.
- A4 / US Letter imposition never silently scales a refill down. If it does not fit at full size, the app shows an error.
- Accurate physical output depends on the printer being set to **100% / Actual size**.

## Dependencies

Planner Refill Maker has no external runtime dependency. PDF generation and layout logic are included in the single HTML build. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for repository notices.

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
