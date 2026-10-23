# Planner Refill Maker — APP_SPEC

## 1. Product identity

- **English name:** Planner Refill Maker
- **Japanese name:** システム手帳リフィルメーカー
- **Current version:** 1.1.0
- **Purpose:** Create dated, undated, and note-paper planner refills in exact physical sizes and export them as exact-size or A4 / US Letter print PDFs.
- **Primary users:** People who use ring-system planners such as A5, Bible, Mini 6, Micro5, HB×WA5, and Davinci Pocket.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. v1.1.0 product scope

The product is a focused refill generator. Users select a planner size, choose a dated, undated, or note layout, preview it, and export a correctly sized printable PDF without manually calculating ring margins, imposition, duplex order, or crop marks.

Current scope:

- Preset and custom planner sizes.
- Year, monthly, weekly, daily, ruled, grid, and dot refills.
- Month-level monthly/yearly ranges, day-level weekly/daily ranges, daily weekday filters, and Monday/Sunday week starts.
- Undated monthly/weekly/daily refills, with 1–100 units per request.
- Japanese holidays where verified static data is bundled.
- Ring-side margin and left/right page mirroring.
- Actual-size PDF export.
- A4 and US Letter print imposition.
- Crop guides, duplex layout, and a print-size test page.
- Paper-edge margins, correctly facing duplex spreads, and trial output of the current page/spread.
- Thumbnail layout choices, mobile page tabs, refill/sheet/bound previews, and accessible enlarged preview.
- Japanese and English UI.
- Fully local, single-HTML distribution with no runtime network requests.

## 3. v1.0.0 release goal

**Holidays / Style / UX**

Add useful print appearance controls without turning the app into a free-form designer. The primary flow remains size → layout → content → print; lower-frequency appearance and persistence controls live in a secondary collapsible section.

Japanese holidays are bundled only when verified against the Cabinet Office publication. v1.0.0 contains 2026 and 2027. Years outside bundled coverage are not estimated or generated. The official source notes that the following year's vernal/autumnal equinox dates are announced in February, so future years must be updated from the official publication rather than guessed.

Appearance choices must affect both the interactive preview and PDF renderer: Minimal / Classic / Tight Margins density, monochrome / Browser Kitty accent output, text size, ruling weight, physical page numbers, and weekly week numbers. Settings are stored only in local browser storage and can be reset with confirmation.

## 4. Core flow

1. Open the app locally or on a static host.
2. Select A5, Bible, Mini 6, Davinci Pocket, Micro5, HB×WA5, or Custom.
3. Select portrait or landscape.
4. Choose Monthly, Yearly, Weekly, Daily, or Notes and its layout.
5. For dated refills, set the month or day range and any weekday/week/hour options. For undated Monthly/Weekly/Daily, set 1–100 units. For Notes, set page count and pattern spacing.
6. Enable verified Japanese holidays when needed and adjust optional appearance settings.
7. Configure ring-side margin, first-page side, and optional punch guides.
8. Choose PDF output: Exact refill size, A4, or US Letter.
9. Choose Single-sided, Long-edge flip, or Short-edge flip. For A4 / Letter, set paper-edge margin and inspect actual front/back content, automatically selected paper orientation, rows/columns, sheets required, and optional crop guides.
10. In duplex mode, prepend a blank front when the first content page is a left page, then append a blank back if needed. Explain blank faces separately from content-page counts.
11. If the refill cannot fit at full size, show an error and do not enable print-sheet PDF creation.
12. Inspect the refill, print-sheet, or duplex bound view; use direct navigation or enlarged preview. Create the full PDF or a distinctly named current-page/spread trial. Generation can be cancelled.
13. Optionally save a print-size test PDF containing a 100 mm reference line, a 50 × 50 mm box, a full-size refill outline when it fits, and paired alignment references for duplex.
14. If any refill or print setting changes after generation, invalidate the old PDF and require regeneration. Empty or invalid active inputs also invalidate output, even while the preview retains the last valid settings. Recheck the actual inputs before create/save and before committing an asynchronous result. Any intervening active setting/draft edit invalidates an in-flight generation, including A → B → A changes.
15. Change language between Japanese and English without reloading.


## v1.0.0 holiday and appearance rules

- Saturday, Sunday, and Japanese holiday text colors are independently configurable and saved locally.
- Holiday color takes precedence when a holiday falls on Saturday or Sunday.
- Holiday names can be shown or hidden on Monthly, Weekly, and Daily layouts. Yearly mini calendars use color/emphasis only because their cells are intentionally compact.
- The supplied Planner Refill Maker SVG is used for both `favicon.svg` and the app header icon.
- Bundled Japanese holiday coverage: **2026 and 2027 only**.
- Source: Cabinet Office, Government of Japan, “National Holidays” / 「国民の祝日について」.
- Runtime network requests are not used to retrieve holiday data.
- Coverage is checked against dates actually rendered, including full-week spillover, visible adjacent-month cells, and mini calendars. If any rendered date is outside coverage, the UI says that data is unavailable and leaves those dates unmarked. Undated output shows neither holiday data nor a coverage warning.
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
- Invalid intermediate values must not crash or distort the last valid preview. They block PDF creation/saving and the print-size test until repaired or a preset size is selected.

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
- An information rail and the first three weekday columns appear on the left; the final four weekday columns appear on the right.
- Both pages keep the same six week rows.
- Left and right pages use mirrored ring-side margins.
- The previous/next mini calendars stay centered inside the information rail, with equal side padding in both the shared Canvas preview and PDF output.

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

- One physical page per included calendar day in the selected day range. All weekdays, weekdays only, or a custom nonempty weekday selection is supported.
- Header shows the date and weekday.
- Main area contains a time schedule plus TODO and Notes sections.
- Start/end hour controls are shared with Weekly Vertical and appear for Daily.
- Daily pages follow the same page-side alternation and ring-margin model as other one-page layouts.

## 12. Note-paper layouts

- Ruled, Grid, and Dot-grid layouts.
- User selects 1–100 pages.
- Ruled spacing is fixed at 7 mm.
- Grid and Dot grid support 4 mm and 5 mm spacing.
- Note-paper preview and PDF use the same Canvas renderer and spacing derived from physical millimeters: 7 mm ruled, 4/5 mm square grid or dot grid. Spacing remains consistent across orientation, page side, ring margins, and appearance presets.
- Note-paper page count replaces date-range controls while Notes is selected.

## 13. Weekly range rule

Weekly pages are generated from the week containing the selected start date through the week containing the selected end date. Boundaries use the selected Monday/Sunday week start.

Examples:

- A single selected day produces its complete week; a range crossing a week boundary produces both weeks.
- Weeks may contain dates from adjacent months.
- Changing Monday/Sunday start recalculates the generated weekly boundaries.

This rule avoids cutting off partial weeks. Migrated version-1 month ranges expand from the first day of the start month through the last day of the end month, preserving their previous weekly output.

## 14. Date model

- Supported month input: January 1900 through December 2100. Day inputs: 1900-01-01 through 2100-12-31.
- Maximum selected month range: 60 months.
- End must be equal to or later than start. Weekly and daily keep separate day ranges; Monthly/Yearly retain month controls. Shortcuts use the user's local current date, then calculations use UTC date-only values.
- Date-only calendar calculations use UTC constructors/getters to avoid timezone/DST shifts.
- Leap years and cross-year ranges must render correctly.
- The preview index is reset/clamped safely after range or refill-type changes.
- An empty daily weekday selection or a range with no included days blocks output with visible guidance.
- Undated Monthly/Weekly/Daily uses 1–100 units, preserving headings, time labels, ruling, and blank date fields. Spread units produce two content pages. No placeholder calendar dates, holiday names/colors, mini calendars, or week numbers may leak into preview/PDF/title/filename. Yearly and Notes ignore inactive date-mode fields.


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
- A paper-edge margin of 0–20 mm reduces the usable paper rectangle before fit and placement. UI presets are 0, 3, 5 mm and Custom; custom input uses 0.5 mm steps. The default is 0 mm for compatibility, with a visible paper-edge clipping note. Exact-size output ignores this inactive margin.
- Refill pages are placed row-major in their original sequence. Empty final slots remain blank.
- The app never reduces refill dimensions to force a fit. If neither paper orientation can contain one refill page, print-sheet output is blocked with an inline message.
- Optional crop guides draw the exact outer rectangle of each refill plus short corner extensions where available.
- The print-layout preview shows paper orientation, columns × rows, pages per sheet, and resulting sheet count.
- Print-size test PDF uses A4 by default and US Letter when Letter output is selected. It contains a 100 mm line and 50 × 50 mm box plus a full-size refill outline when it fits. Duplex tests provide front/back alignment references and matching flip-edge instructions.
- All print PDFs include guidance to print at 100% / Actual size and avoid Fit to page.
- Crop guides stay within the paper bounds. Nonzero margins can reduce slot counts without shrinking refills: A5 on A4 has two slots at 0 mm and one at 5 mm.
- Duplex output mirrors back-side slots according to long-edge / short-edge flip and consumes the same padded print sequence as exact output and previews.

## 17. Duplex printing

- Modes: Single-sided, Long-edge flip, Short-edge flip.
- Logical content pages, padded physical faces, and imposed sheets are separate concepts. Logical page numbers never count padding blanks.
- Duplex prepends a blank front when the first logical page is left-sided, then appends a blank back when the resulting face count is odd. For two spreads `[L1,R1,L2,R2]`, the prepared sequence is `[blank,L1,R1,L2,R2,blank]`; the first spread's left and right pages face after binding.
- Exact-size PDF uses this prepared sequence. A4 / US Letter pairs consecutive prepared faces into refill leaves and batches leaves into available sheet slots. Single-sided output has no duplex padding.
- Back-side slot positions are mirrored according to paper orientation and selected flip edge.
- When the printer flips about a horizontal paper axis (portrait short-edge / landscape long-edge), rotate back artwork 180° so cut refills remain upright when turned on their left/right ring edge. Apply this to exact back faces and imposed back slots, using actual paper dimensions; sheet preview shows the physical rotation and bound preview shows readable content.
- Long-edge and short-edge settings must be matched in the printer dialog; the app explains this rather than attempting printer control.
- Front/back previews label actual content and blank faces; bound preview shows facing pages and is disabled in single-sided mode.
- Duplex mode participates in the PDF freshness signature.

## 18. Preview and navigation

- Preview keeps the configured physical page width/height ratio.
- One-page layouts show one page; spread / Weekly + Notes show two facing pages.
- Current unit, position, physical dimensions, selected layout, and generated page count are visible.
- Navigation unit changes by refill type: month, year, or week.
- Previous/next controls disable at range boundaries.
- Direct unit navigation, individual spread-side inspection, and an enlarged native dialog are available. The enlarged view supports scrolling, Escape/backdrop/close dismissal, and focus restoration.
- Preview modes are Refill, Print sheets, and Bound. Display indexes and modes are presentation state, excluded from saved settings and the PDF freshness signature; changing only the view does not invalidate a PDF.
- Left/Right arrow navigation is available when focus is not inside an input and the help dialog is closed.
- Desktop: settings and preview are side by side and preview remains sticky.
- Smartphone: the adapted canonical bottom bar switches between Settings, Preview, and PDF output at 600 px and below; only the active page is shown. Preserve entered values and make errors reachable across tabs. Bottom safe-area spacing prevents controls from being covered. No page-level horizontal scrolling is allowed.

## 19. Privacy and data

- User-selected settings JSON files are accepted locally under the bounded settings-file contract below.
- No setting or generated calendar data is sent outside the browser.
- No runtime network request, analytics, telemetry, or external font.
- CSP keeps `connect-src 'none'`.
- Language preference and planner configuration may be stored locally in browser storage.
- Saved settings contain configuration only; no generated PDF bytes or calendar files are persisted.
- A confirmed reset replaces the saved planner configuration with defaults. If browser storage is unavailable, defaults still apply in memory and a persistence warning remains visible.
- Holiday, appearance, ring, and print settings are part of the generated PDF signature, so changing them invalidates stale output.

## 20. UX and accessibility

- Browser Kitty brand color `#16624F`.
- SVG icons rather than emoji for UI controls.
- Visible focus and keyboard-operable controls.
- Radio semantics for size/orientation/refill/layout/week-start choices.
- Roughly 44 px touch targets for primary controls.
- Only layout choices relevant to the selected refill type are shown.
- Hour controls appear for Weekly Vertical and Daily.
- Adjacent-month toggle appears only for Monthly.
- Help dialog scrolls fully on narrow/short viewports.
- Build information is a collapsible section at the bottom of Help on desktop; it and the page footer are hidden at the smartphone breakpoint (600 px and below).
- Header typography, icon size, version styling, and language/Help actions follow Browser Kitty's Pass-the-Phone Vote header, while retaining the planner workspace width. The subtitle describes planner-sized printable refills; the separate local-processing shield badge remains visible. The hero heading is 26 px maximum on desktop and 20 px on phones.
- Japanese and English strings fit at 360 px width.
- Invalid date/time ranges produce inline guidance. Empty numeric drafts remain invalid on blur; finite numeric values retain the existing range normalization.
- PDF readiness validates only applicable fields: custom size only for Custom, month/day dates only for the active dated type, weekday selection only for dated Daily, undated count only for undated Monthly/Weekly/Daily, note count only for Notes, hours only for Daily / Weekly Vertical, paper-edge margin only for imposed output, and manual ring margin only in Manual mode.
- Print-size test validity depends on dimensions. It must not download stale results if settings change or dimensions become invalid during generation.

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
- Reset settings asks for confirmation, replaces saved planner settings with defaults, and restores the language-appropriate default holiday state.
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
- **v1.1.0:** Physical print planning, paper-edge margins, day ranges, undated refills, visual/mobile workflow, trial output, and cancellable generation.

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


## Settings files and safe restore

- The Appearance section offers **Save settings (.settings.json)** and **Load settings (JSON)** in Japanese and English. There is no named-preset manager or remote storage.
- Save uses the editable PDF filename stem plus `.settings.json`, with the existing filename sanitization. Invalid active drafts block saving; inactive drafts use the last committed valid setting.
- New files use `{ "app": "planner-refill-maker", "formatVersion": 2, "settings": { ... } }`. Every version-2 field is required. The allowlist adds paper-edge margin, date mode, undated count, separate weekly/daily start/end dates, and daily weekday selection to the original settings.
- Version-1 files remain supported and must contain every original version-1 field. Validate them strictly before migration: margin defaults to 0, date mode to dated, weekday selection to all days, and weekly/daily ranges expand the original start/end months to their first/last days. Unsupported versions and malformed legacy inputs remain errors; migration must not silently replace old periods with today's dates.
- Files exclude language preference, filename, derived base geometry, navigation position, runtime flags, Blob URLs, and PDF contents. Extra unrecognized fields are ignored and never spread into state.
- Maximum selected size: **64 KiB**, checked before reading and again against UTF-8 text size. Unsupported app/version, malformed JSON, wrong types/enums, missing fields, invalid layout/type pairs, colors, numeric bounds, date ranges, or hour relationships reject the complete file without changing current settings, local storage, or generated PDF. Values are not clamped during import.
- Named dimensions always come from the built-in PRESETS table. Custom base dimensions come from validated width/height; landscape swaps only effective dimensions. Stale legacy baseWidth/baseHeight can never override either source.
- A shared decoder handles legacy local browser settings, permitting missing known fields and nested layout entries to use defaults. Invalid stored settings fall back visibly to defaults. Original unreadable records are preserved and autosave pauses until an explicit reset or confirmed import. Storage read/write failures are shown honestly; file save/load remains usable in memory.
- After validation, a keyboard-operable native confirmation dialog shows size, physical dimensions, orientation, layout, and period or note-page count. Cancel, Close, Escape, and backdrop dismissal preserve the current setup/PDF. Focus starts on Cancel and returns to the trigger; the mobile sheet and short-view body remain scrollable with safe-area padding.
- Only confirmation replaces settings, synchronizes controls, clears obsolete field errors, resets preview position, and invalidates the PDF and both pending PDF generation paths, even for identical values. The PDF must be generated again explicitly.
- New file selections, intervening settings edits/reset, and page exit invalidate pending file reads/confirmations. Inputs reset after selection so the same file can be chosen again. Stale reads cannot overwrite newer state or status.
- Required automated verification runs the real application event handlers and PDF writer on source, checked-in standalone, readable build, and the byte-verified expanded self-extract payload. Browser raster output, real mobile/keyboard behavior, and physical print accuracy still require browser/device testing; the Node DOM/Canvas adapter cannot establish those results.

## v1.0.1 header contract

- The language button shows its target as `EN` in Japanese and `JA` in English, with matching localized title and accessible name: `英語に切り替え` / `Switch to Japanese`.
- Header version is `v` plus the canonical `app.config.json` version; Help controls retain localized titles and accessible names.
- Language changes preserve settings and filename, and retain the existing requirement to regenerate the localized PDF after a language change. The stale-output notice follows subsequent language changes without replacing later generation errors. Privacy remains `完全ローカル処理` / `Fully local processing`.

## v1.0.2 icon consistency

- The canonical icon background and matching green details use `#16624f`.
- Background corner radii are exactly 25% of their corresponding width and height; existing bounds, padding, and foreground artwork are preserved.
- Header, favicon, and self-extract loader inherit the canonical `assets/favicon.svg`.

## v1.0.3 modal background scrolling

- While any native modal is open, both document scroll containers (`html` and `body`) use `:has(dialog:modal)` to pause background scrolling. Closing the last modal restores ordinary page scrolling through CSS alone.
- Preserve the existing Help and confirmation dialog sizes, fixed headers, internal scroll regions, safe-area padding, native dismissal/focus behavior, and the local-processing shield badge.
- Help explains background locking and internal scrolling in Japanese and English. Settings, calendar/PDF rendering, import/export, and persistence behavior are unchanged.
- `tests/modal-scroll.test.mjs` guards modal-state rules, dialog structure, and dismissal contracts without freezing unrelated application code. `PLANNER_HTML` accepts a template, readable release, or gzip self-extract wrapper. The repository check discovers this test, and the canonical runtime runner repeats it on the checked-in standalone, readable build, and byte-verified restored payload.

## v1.1.0 acceptance criteria

- Canonical metadata and header fallback report 1.1.0. Earlier supported layouts, sizes, settings files, language switching, and local-only distribution remain available.
- Left-first spreads and single pages have correct physical front/back order in exact and imposed duplex output. Right-first pages retain their starting side; padding is explained and never changes logical page numbers.
- Full export, current-page/spread trial, count estimates, print-sheet preview, and bound preview consume the same physical planning helpers. Trial output is clearly named and identified without mutating the selected date range.
- Margin changes affect fit and placement at original physical scale, with field validation and migration coverage.
- Separate day ranges, leap days, full-week spillover, weekday filtering, inactive fields, and the 60-month bound have behavior tests. Legacy ranges produce the same dates after migration.
- Every undated monthly/weekly/daily renderer is tested for blank date fields and absence of synthetic date/holiday text, while retaining intended weekday/time/ruling content.
- Generation uses an explicit revision/cancellation guard before further pages and before publishing a result. Cancelled, stale, invalid, or A → B → A work cannot become downloadable as a fresh PDF.
- Desktop and 360–393 px phone workflows, Japanese/English, keyboard navigation, enlarged/Help/confirmation dialogs, edited filenames, and no runtime requests are checked in an actual browser.
- Canonical PowerShell syntax/build/repository checks pass. Root standalone and both distribution variants share the tested application; self-extract restores readable HTML byte-for-byte.
- Physical printer scaling/registration and untested browser engines are reported as limits, never implied by the Node Canvas adapter or Chromium QA.
- Browser acceptance: in Japanese and English at desktop, 393 px phone width, and 393 × 252 px, wheel input outside Help or the settings confirmation must leave the background position unchanged. Internal scrolling must reach the final Help item and confirmation actions. Close, Cancel, Escape, backdrop dismissal, repeated opening, and normal scrolling after dismissal retain their existing behavior. These native layout/scroll results require browser verification beyond the Node contracts.
