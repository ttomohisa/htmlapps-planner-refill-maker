# Planner Refill Maker — APP_SPEC

## 1. Product identity

- **English name:** Planner Refill Maker
- **Japanese name:** システム手帳リフィルメーカー
- **Current version:** 1.0.0
- **Purpose:** Create dated planner refill layouts in exact physical sizes and export them as exact-size or A4 / US Letter print PDFs.
- **Primary users:** People who use ring-system planners such as A5, Bible, Mini 6, Micro5, HB×WA5, and Davinci Pocket.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. v1.0.0 product scope

The product is not a free-form page designer. It is a focused refill generator that should eventually let a user select a planner size, choose a dated or note layout, preview it, and export a correctly sized printable PDF without manually calculating ring margins, imposition, duplex order, or crop marks.

v1.0.0 scope:

- Preset and custom planner sizes.
- Year, monthly, weekly, daily, ruled, grid, and dot refills.
- Arbitrary date ranges and Monday/Sunday week starts.
- Japanese holidays where verified static data is bundled.
- Ring-side margin and left/right page mirroring.
- Actual-size PDF export.
- A4 and US Letter print imposition.
- Crop guides, duplex layout, and a print-size test page.
- Japanese and English UI.
- Fully local, single-HTML distribution with no runtime network requests.

## 3. v1.0.0 release goal

**Holidays / Style / UX**

Add useful print appearance controls without turning the app into a free-form designer. The primary flow remains size → layout → content → print; lower-frequency appearance and persistence controls live in a secondary collapsible section.

Japanese holidays are bundled only when verified against the Cabinet Office publication. v1.0.0 contains 2026 and 2027. Years outside bundled coverage are not estimated or generated. The official source notes that the following year's vernal/autumnal equinox dates are announced in February, so future years must be updated from the official publication rather than guessed.

Appearance choices must affect both the interactive preview and PDF renderer: Minimal / Classic / Tight Margins density, monochrome / Browser Kitty accent output, text size, ruling weight, physical page numbers, and weekly week numbers. Settings are stored only in local browser storage and can be reset with confirmation.

## 4. Core v1.0.0 flow

1. Open the app locally or on a static host.
2. Select A5, Bible, Mini 6, Davinci Pocket, Micro5, HB×WA5, or Custom.
3. Select portrait or landscape.
4. Choose Monthly, Yearly, Weekly, Daily, or Notes and its layout.
5. For dated refills, set the date range and any week/hour options. For Notes, set page count and pattern spacing.
6. Enable verified Japanese holidays when needed and adjust optional appearance settings.
7. Configure ring-side margin, first-page side, and optional punch guides.
8. Choose PDF output: Exact refill size, A4, or US Letter.
9. Choose Single-sided, Long-edge flip, or Short-edge flip. For A4 / Letter, inspect front/back sheet positions, automatically selected paper orientation, rows/columns, sheets required, and optional crop guides.
10. If the logical page count is odd in duplex mode, add one blank final back side and explain it in the UI.
11. If the refill cannot fit at full size, show an error and do not enable print-sheet PDF creation.
12. Create and save the PDF.
13. Optionally save a print-size test PDF containing a 100 mm reference line, a 50 × 50 mm box, and a full-size refill outline when it fits.
14. If any refill or print setting changes after generation, invalidate the old PDF and require regeneration.
15. Change language between Japanese and English without reloading.


## v1.0.0 holiday and appearance rules

- Saturday, Sunday, and Japanese holiday text colors are independently configurable and saved locally.
- Holiday color takes precedence when a holiday falls on Saturday or Sunday.
- Holiday names can be shown or hidden on Monthly, Weekly, and Daily layouts. Yearly mini calendars use color/emphasis only because their cells are intentionally compact.
- The supplied Planner Refill Maker SVG is used for both `favicon.svg` and the app header icon.
- Bundled Japanese holiday coverage: **2026 and 2027 only**.
- Source: Cabinet Office, Government of Japan, “National Holidays” / 「国民の祝日について」.
- Runtime network requests are not used to retrieve holiday data.
- If the selected period includes an uncovered year, the UI says that data is unavailable and leaves those dates unmarked.
- Holiday emphasis must not depend on color alone; weight/background treatment is also used.
- Minimal / Classic / Tight Margins are bounded presets, not a free-form designer.
- Accent output may use Browser Kitty `#16624F`; monochrome remains the default.
- Saved settings remain local to the browser and contain configuration only.

## 5. Preset sizes

| Preset | Width | Height |
|---|---:|---:|
| A5 | 148 mm | 210 mm |
| Bible | 95 mm | 170 mm |
| Mini 6 | 80 mm | 126 mm |
| Davinci Pocket | 76 mm | 126 mm |
| Micro5 | 62 mm | 105 mm |
| HB×WA5 | 148 mm | 170 mm |

Preset labels always show dimensions so similarly named standards are not ambiguous.

## 6. Custom size

- Width: 40–300 mm.
- Height: 60–400 mm.
- Step: 0.1 mm.
- Do not clamp while the user is typing.
- Normalize to the accepted range on `change` / `blur`.
- Invalid intermediate values must not crash or distort the preview.

## 7. Orientation model

Stored preset/custom dimensions remain portrait-base dimensions. Landscape swaps effective width and height without mutating base dimensions.

## 8. Monthly layouts

### Monthly · one page

- One physical page per month.
- Seven weekday columns.
- Six fixed week rows.
- Optional adjacent-month dates.

### Monthly · spread

- One month uses two facing physical pages.
- First four weekday columns on the left, final three on the right.
- Both pages keep the same six week rows.
- Left and right pages use mirrored ring-side margins.

## 9. Yearly layouts

### Year · one page

- One physical page per calendar year.
- Twelve mini calendars, January through December.
- Weekday order follows Monday/Sunday week-start setting.
- If the selected month range touches only part of a year, that year preview still represents the complete calendar year.

### Year · spread

- Two facing pages per calendar year.
- January–June on the left page.
- July–December on the right page.
- Page count is two pages per included calendar year.

## 10. Weekly layouts

### Weekly block

- One physical page per week.
- Seven day blocks plus one memo block in a 4 × 2 arrangement.
- Weekday order follows the selected week start.

### Weekly + notes

- Two facing pages per week.
- Left page contains seven day rows.
- Right page is a lined notes page.
- Page count is two pages per generated week.

### Weekly vertical

- One physical page per week.
- Seven weekday columns plus a time-label column.
- User-selectable start/end hour.
- Start hour: 0–23; end hour: 1–24; end must be later than start.
- Hour settings are normalized on `change` / `blur`, not while typing.


## 11. Daily layout

- One physical page per calendar day in the selected month range.
- Header shows the date and weekday.
- Main area contains a time schedule plus TODO and Notes sections.
- Start/end hour controls are shared with Weekly Vertical and appear for Daily.
- Daily pages follow the same page-side alternation and ring-margin model as other one-page layouts.

## 12. Note-paper layouts

- Ruled, Grid, and Dot-grid layouts.
- User selects 1–100 pages.
- Ruled spacing is fixed at 7 mm.
- Grid and Dot grid support 4 mm and 5 mm spacing.
- PDF pattern spacing is derived from physical millimeters rather than CSS pixels.
- Note-paper page count replaces date-range controls while Notes is selected.

## 13. Weekly range rule

Weekly pages are generated from the week containing the first day of the selected start month through the week containing the final day of the selected end month.

Examples:

- A one-month range can produce four, five, or six weekly pages depending on calendar alignment and selected week start.
- Weeks may contain dates from adjacent months.
- Changing Monday/Sunday start recalculates the generated weekly boundaries.

This rule avoids cutting off partial weeks at month boundaries.

## 14. Date model

- Supported input: January 1900 through December 2100.
- Maximum selected month range: 60 months.
- End month must be equal to or later than start month.
- Date-only calendar calculations use UTC constructors/getters to avoid timezone/DST shifts.
- Leap years and cross-year ranges must render correctly.
- The preview index is reset/clamped safely after range or refill-type changes.


## 15. Ring-side margin model

- Automatic defaults: A5 15 mm, Bible 12 mm, Mini 6 10 mm, Davinci Pocket 10 mm, Micro5 8 mm, HB×WA5 15 mm, Custom 12 mm.
- Manual range: 4–30 mm in 0.5 mm steps.
- A right-hand page reserves the larger margin on its left edge.
- A left-hand page reserves the larger margin on its right edge.
- One-page layouts alternate page sides beginning from the selected first-page side.
- Monthly Spread, Year Spread, and Weekly + Notes keep fixed left/right semantics regardless of the first-page setting.
- Ring-side margin changes affect preview and PDF rasterization while preserving the physical page MediaBox.
- Optional punch marks are alignment guides only; they do not claim exact binder-hole specifications.

## 16. Print-sheet imposition

- Output choices: Exact refill size, A4, and US Letter.
- A4 dimensions: 210 × 297 mm; US Letter: 215.9 × 279.4 mm.
- For A4 / Letter, portrait and landscape paper orientations are evaluated automatically.
- The orientation with the highest number of unscaled refill pages per sheet is selected.
- Refill pages are placed row-major in their original sequence. Empty final slots remain blank.
- The app never reduces refill dimensions to force a fit. If neither paper orientation can contain one refill page, print-sheet output is blocked with an inline message.
- Optional crop guides draw the exact outer rectangle of each refill plus short corner extensions where available.
- The print-layout preview shows paper orientation, columns × rows, pages per sheet, and resulting sheet count.
- Print-size test PDF uses A4 by default and US Letter when Letter output is selected. It contains a 100 mm line and 50 × 50 mm box; when the refill fits, a second page shows its full-size outer rectangle.
- All print PDFs include guidance to print at 100% / Actual size and avoid Fit to page.
- Duplex output mirrors back-side slots according to long-edge / short-edge flip and adds a blank final back side when needed.

## 17. Duplex printing

- Modes: Single-sided, Long-edge flip, Short-edge flip.
- Exact-size PDF keeps logical front/back page order. If the logical page count is odd, one blank PDF page is appended so the final back remains blank.
- A4 / US Letter imposition pairs logical pages as front/back refill faces: 1/2, 3/4, and so on.
- Back-side slot positions are mirrored according to paper orientation and selected flip edge.
- Long-edge and short-edge settings must be matched in the printer dialog; the app explains this rather than attempting printer control.
- Front/back mini previews show the resulting slot geometry.
- Duplex mode participates in the PDF freshness signature.

## 18. Preview and navigation

- Preview keeps the configured physical page width/height ratio.
- One-page layouts show one page; spread / Weekly + Notes show two facing pages.
- Current unit, position, physical dimensions, selected layout, and generated page count are visible.
- Navigation unit changes by refill type: month, year, or week.
- Previous/next controls disable at range boundaries.
- Left/Right arrow navigation is available when focus is not inside an input and the help dialog is closed.
- Desktop: settings and preview are side by side and preview remains sticky.
- Smartphone: preview appears above settings and must not create page-level horizontal scrolling.

## 19. Privacy and data

- No user files are accepted in v1.0.0.
- No setting or generated calendar data is sent outside the browser.
- No runtime network request, analytics, telemetry, or external font.
- CSP keeps `connect-src 'none'`.
- Language preference and planner configuration may be stored locally in browser storage.
- Saved settings contain configuration only; no generated PDF bytes or calendar files are persisted.
- A confirmed reset action removes saved planner settings and restores defaults.
- Holiday, appearance, ring, and print settings are part of the generated PDF signature, so changing them invalidates stale output.

## 20. UX and accessibility

- Browser Kitty brand color `#16624F`.
- SVG icons rather than emoji for UI controls.
- Visible focus and keyboard-operable controls.
- Radio semantics for size/orientation/refill/layout/week-start choices.
- Roughly 44 px touch targets for primary controls.
- Only layout choices relevant to the selected refill type are shown.
- Weekly-hour controls appear only for Weekly Vertical.
- Adjacent-month toggle appears only for Monthly.
- Help dialog scrolls fully on narrow/short viewports.
- Japanese and English strings fit at 360 px width.
- Invalid date/time ranges produce inline guidance.

## 21. Browser target

Current stable desktop and mobile Chromium, Firefox, and Safari where the template itself is supported. Direct `file://` opening remains a distribution requirement.

## 22. v1.0.0 acceptance criteria

- App metadata reports version 1.0.0.
- All v0.7.0 Monthly / Yearly / Weekly / Daily / Notes, ring margin, exact-size PDF, imposition, crop-guide, and duplex behavior remains available.
- Japanese holiday toggle is available for dated layouts and defaults on for Japanese UI / off for English UI on a clean browser profile.
- Bundled holiday data exactly covers the Cabinet Office 2026 and 2027 publication used for this release, including substitute / citizen holidays listed there.
- Selecting a period containing an uncovered year shows a plain-language unavailable-data note; the app does not generate or estimate missing holidays.
- Monthly, yearly mini-calendar, weekly, and daily previews visibly distinguish bundled holidays without relying on color alone.
- Exported PDFs apply the same holiday emphasis to Monthly, Yearly, Weekly, and Daily pages.
- Minimal, Classic, and Tight Margins presets update the preview and PDF renderer; Tight Margins reduces printable outer margins rather than acting as a CSS-only preview change.
- Monochrome is the default print style. Accent mode uses Browser Kitty `#16624F` only as an accent and remains readable when printed without color.
- Text size can switch among Small / Standard / Large / X-Large / Max in preview and PDF output.
- Ruling can switch between Light / Standard in preview and PDF output.
- Optional physical page numbers appear in sequential order in preview and exported logical pages.
- Optional week numbers appear on weekly headings using the selected week-start convention.
- Appearance controls live in a secondary collapsible `見た目 / Appearance` section and do not interrupt the primary size → layout → content → print flow. Settings continue to persist locally within that section.
- Settings automatically restore from local browser storage after reload, including nested layout choices.
- Reset settings asks for confirmation, clears saved planner settings, and restores the language-appropriate default holiday state.
- Changing holiday or appearance settings after PDF generation invalidates stale output and requires regeneration.
- A5 portrait PDF MediaBox remains 148 × 210 mm, and A4 / US Letter imposition remains unscaled.
- Long-edge / short-edge duplex slot mirroring and odd final blank-back behavior remain correct.
- Japanese / English switch works without reload and redraws holiday names / Daily labels correctly.
- No page-level horizontal scrolling occurs at 360 px width with the Appearance section expanded.
- Source retains the template embedded-asset API and toast component.
- `__APP_ICON_DATA_URI__` is used exactly twice: favicon and header brand icon.
- Runtime CSP contains `connect-src 'none'`.
- No runtime HTTP/CDN dependency is required by the built app.
- `dist/index.self-extract.html` restores `dist/index.html` byte-for-byte.

## 23. Roadmap

- **v0.4.0:** Actual-size PDF export. **Implemented.**
- **v0.5.0:** Ring margin, left/right page mirroring, punch guide. **Implemented.**
- **v0.6.0:** A4/US Letter imposition, crop guides, print-size test page. **Implemented.**
- **v0.7.0:** Duplex printing, daily, ruled/grid/dot refills. **Implemented.**
- **v0.8.3:** Japanese holidays, style options, settings persistence, UX polish. **Implemented.**
- **v0.8.7:** Preview/PDF parity for Monthly Spread and preview-only page-side labels. **Implemented.**
- **v0.9.0:** Release candidate and broad regression testing. **Implemented.**
- **v1.0.0:** Initial stable release, README/screenshots/final release checks. **Implemented.**

## 24. Non-goals for v1.0.0

- Canva-style arbitrary object placement.
- Stickers, decorative asset marketplace, or photo backgrounds.
- Cloud storage or user accounts.
- Direct Google Calendar / Outlook API synchronization.
- GoodNotes-specific hyperlink authoring.
- Server-side PDF generation.


## v0.8.7 Monthly Spread / Preview-PDF parity

- Monthly Spread divides each physical page into four equal content columns.
- The left page uses column 1 as an information rail and columns 2–4 for the first three weekdays.
- The right page uses all four columns for the remaining four weekdays. This keeps all seven day cells the same width and height.
- The information rail centers the current month near the top, centers the year directly below, and centers previous / next mini calendars in the lower area.
- Minimal, Classic, and Tight Margins use distinct system-font stacks and matching PDF Canvas font stacks. No runtime web-font request is added.

### v0.8.7 preview/PDF parity

- Monthly Spread uses shared information-rail geometry for browser preview and Canvas/PDF rendering.
- The left information rail keeps month/year at the top and previous/next mini calendars in the lower area using the same proportional positions in preview and PDF.
- Left/right page-side labels are editing aids shown only in the browser preview; exported PDFs do not contain those labels.
- The secondary settings section is labeled `見た目 / Appearance`.


## v1.0.0 Stable release status

- v1.0.0 promotes the validated v0.9.0 release candidate to the first stable release without adding new feature scope.
- Broad regression covers Monthly / Yearly / Weekly / Daily / Notes, Japanese / English, phone / desktop layout, exact-size PDF, A4 / US Letter imposition, duplex, ring margins, holidays, appearance settings, and standalone/self-extract output.
- Final release work removes the duplicate settings-card version badge, keeps the header version badge, refreshes README/screenshots, and completes the release regression checklist.
