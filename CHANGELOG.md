# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-09-17

### Changed

- Promoted Planner Refill Maker from the v0.9.0 release candidate to the first stable release.
- Removed the duplicate version badge from the refill-settings card while keeping the version in the app header.
- Rewrote the English and Japanese READMEs around the live demo, features, quick start, usage, privacy, limitations, and build layout.
- Refreshed Japanese, English, and mobile screenshots for the stable release.
- Completed the final regression pass across layouts, PDF output, localization, mobile layout, CSP, and single-HTML/self-extract artifacts.
- Aligned the PDF filename control with the latest htmlapps-template `outputFilename` behavior marker required by repository validation.

## [0.9.0] - 2026-09-17

### Changed

- Release-candidate feature freeze and broad regression pass.
- Shifted the Monthly Spread year slightly left while keeping the shared Canvas preview/PDF renderer.
- Increased holiday-name typography again across Monthly, Weekly, Vertical, and Daily layouts.
- Updated README and in-app release-candidate copy for v0.9.0.

## 0.8.7

- Changed text size to a five-step slider, adding two sizes above the previous Large setting.
- Increased holiday-name typography across monthly, weekly, vertical, and daily layouts.
- Enlarged the month and year in the Monthly spread information rail.
- Unified Monthly spread browser preview with the PDF Canvas renderer to prevent layout drift.

## v0.8.5

- Browser preview now changes actual ruling/grid border width for Thin vs Standard.
- Fixed adjacent-month weekend dates leaking into the mini calendars.
- Enlarged the month/year in exported Monthly spread PDFs and shifted the whole left information rail slightly left.

## [0.8.4] - 2026-09-17

### Changed
- Renamed the secondary section from `見た目・保存 / Appearance & saved settings` to `見た目 / Appearance`.
- Unified Monthly Spread information-rail geometry between the browser preview and Canvas/PDF renderer through shared layout metrics.
- Kept left/right page-side labels as preview-only guidance and removed them from exported PDF pages.

## [0.8.3] - 2026-09-16

### Changed
- Fixed the text-size control so Small / Standard / Large affects calendar days, weekdays, holiday labels, weekly layouts, daily layouts, and mini calendars in the preview as well as PDF output.
- Renamed the `Compact` style to `余白狭め / Tight Margins` to make its purpose clearer.
- Centered the month, year, and mini calendars in the left information rail of Monthly Spread.
- Enlarged the Japanese month number while keeping the `月` suffix smaller.
- Increased holiday-name text size in preview and PDF output.

## v0.8.2

### Changed

- Rebuilt Monthly Spread so every weekday uses the same-size day cell across both facing pages.
- Added a left-page information rail with the current month, year, and previous / next mini calendars.
- Made Minimal, Classic, and Compact visually distinct through different system font stacks, title weights, line treatments, density, and page backgrounds.
- Applied the same style-specific typography to Canvas/PDF output without adding runtime font downloads.
- Updated in-app help and documentation for the new Monthly Spread structure.

## [0.8.1] - 2026-09-16

### Added

- Supplied Planner Refill Maker icon applied to the favicon and in-app brand icon.
- Separate color controls for Saturdays, Sundays, and Japanese holidays.
- Optional holiday-name labels on Monthly, Weekly, and Daily refills.

### Changed

- Day-off colors and holiday-name settings now apply consistently to preview and PDF output and participate in saved settings / PDF freshness checks.

## [0.8.0] - 2026-09-16

### Added

- Verified static Japanese holiday data for 2026 and 2027, sourced from the Cabinet Office and never guessed for uncovered years.
- Minimal, Classic, and Compact page-style presets.
- Monochrome / Browser Kitty accent print styles.
- Small / standard / large text size and light / standard ruling controls.
- Optional physical page numbers and weekly week numbers.
- Automatic local settings persistence with a confirmed reset action.

### Changed

- Holiday highlighting now applies consistently to preview and PDF output for Monthly, Yearly mini calendars, Weekly, and Daily layouts.
- Compact style now changes printable content margins as well as the on-screen preview.
- Appearance and persistence controls are grouped under a secondary “Appearance & saved settings” section to keep the primary flow focused.
- PDF freshness now includes holiday and appearance settings.
- Updated in-app help, APP_SPEC, and README files for v0.8.0.

## [0.7.0] - 2026-09-16

### Added

- Daily one-page refills with configurable schedule hours, TODO, and Notes areas.
- Ruled, grid, and dot-grid note refills with 1–100 page count and physical millimeter spacing.
- Single-sided, long-edge flip, and short-edge flip PDF modes.
- Front/back imposition preview for duplex A4 / US Letter output.
- Back-side slot mirroring based on paper orientation and selected flip edge.
- Automatic blank final back side when duplex output has an odd logical page count.

### Changed

- PDF freshness now includes duplex mode, note count, and note spacing.
- Ring-side margin and page-side alternation now apply to Daily and note-paper refills.
- Updated in-app help, APP_SPEC, and README files for v0.7.0.

## [0.6.0] - 2026-09-16

### Added

- Full-size A4 and US Letter print-sheet imposition.
- Automatic print-paper orientation selection that maximizes unscaled refill pages per sheet.
- Print-layout preview with columns, rows, pages per sheet, and required sheet count.
- Optional crop guides around each imposed refill.
- Oversize detection that blocks print-sheet export instead of silently scaling refills.
- Print-size test PDF with a 100 mm reference line, 50 × 50 mm box, and full-size refill outline when it fits.

### Changed

- PDF output settings now switch between Exact refill size, A4, and US Letter.
- Generated PDF freshness now includes print-paper and crop-guide settings.
- Updated in-app help, APP_SPEC, and README files for v0.6.0.

## [0.5.0] - 2026-09-16

### Added

- Size-based automatic ring-side margins with manual 4–30 mm override.
- First-page side selection for one-page layouts with automatic left/right alternation.
- Fixed left/right semantics for Monthly Spread, Year Spread, and Weekly + Notes.
- Optional punch-position alignment guides in preview and exported PDF.
- Ring-side summary showing effective margin and page-side behavior.

### Changed

- Preview content boxes now reserve space on the binding edge.
- PDF rasterization mirrors the same ring-side geometry while preserving exact MediaBox dimensions.
- Updated in-app help and documentation to v0.5.0.

## [0.4.0] - 2026-09-16

### Added

- Exact-size PDF export for Monthly, Yearly, and Weekly refill layouts.
- Browser-local page rasterization that preserves Japanese and English text without runtime font downloads.
- PDF page MediaBox dimensions generated directly from the selected millimeter size.
- PDF generation progress, success, error, and save states.
- Editable, sanitized PDF filename.
- Generated PDF invalidation when refill settings change.

### Changed

- Updated in-app help and print guidance for 100% / Actual size printing.
- Updated app metadata and documentation to v0.4.0.

## [0.3.0] - 2026-09-15

### Added

- Refill type switching for Monthly, Yearly, and Weekly previews.
- One-page yearly overview with twelve mini calendars.
- Two-page yearly spread with January–June and July–December.
- Weekly Block layout with seven day blocks and a memo block.
- Weekly + Notes spread with a full notes page.
- Weekly Vertical layout with configurable start/end hour.
- Weekly range generation that includes partial boundary weeks.
- Year/week navigation and generated page counts for the new refill types.
- Updated Japanese/English UI and help for yearly and weekly workflows.

### Changed

- Generalized the app introduction, preview navigation, and summary from monthly-only to dated refill types.
- Updated app metadata and documentation to v0.3.0.

## [0.2.0] - 2026-09-15

### Added

- Dated one-page monthly calendar generation.
- Two-page monthly spread with aligned six-week rows.
- Arbitrary start/end month selection from 1900-01 through 2100-12, capped at 60 months.
- Monday-first and Sunday-first calendar modes.
- Optional adjacent-month dates in leading and trailing calendar cells.
- Month navigation with buttons and Left/Right arrow keys.
- Generated month/page count and date-range validation.
- Updated Japanese/English help and UI for the monthly workflow.

### Changed

- Replaced the generic v0.1.0 paper sample with real monthly refill previews.
- Updated app metadata and documentation to v0.2.0.

## [0.1.0] - 2026-09-15

### Added

- Initial Planner Refill Maker foundation based on the Browser Kitty single-HTML template.
- Preset sizes for A5, Bible, Mini 6, Davinci Pocket, Micro5, and HB×WA5.
- Custom planner size input in millimeters.
- Portrait and landscape orientation switching.
- Responsive proportional refill preview with effective dimension labels.
- Japanese and English UI and in-app help.
- Local-only runtime with `connect-src 'none'` and no third-party runtime dependencies.
