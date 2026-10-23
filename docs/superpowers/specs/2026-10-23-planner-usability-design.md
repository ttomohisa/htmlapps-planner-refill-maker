# Planner Refill Maker v1.1.0 design

## Authorization and intent

The user approved implementing the recommended first three improvements and opening a PR on 2026-10-23. This design records that accepted direction and routine implementation decisions. The target is GitHub main at `118c9c43776d299627b293cd79095c250f99ece7` (v1.0.3). No merge or production deployment is authorized.

Make refills dependable to print and bind, easier to choose and inspect on a phone, and convenient to generate for only the required dates.

## Approaches

1. Keep the existing single HTML and improve print planning, bounded date controls, and navigation. Chosen from the user's approval of the recommended first three improvements; it preserves the existing layouts and offline distribution.
2. Add broad paper customization and named presets. Useful later, but outside this PR.
3. Create multi-layout monthly packs or a free-form editor. Larger work with additional ordering semantics; outside this PR.

## Product requirements

### Printing

- Distinguish logical refill pages, the faces of a physical refill, and imposed printer sheets.
- In duplex mode, a logical sequence starting with a left page receives an initial blank front; pad the final back if needed. Example `[L1,R1,L2,R2]` becomes `[blank,L1,R1,L2,R2,blank]`. This also applies to one-page layouts explicitly starting on the left. Keep logical page numbers unchanged by padding.
- Share this print sequence across exact PDFs, A4/Letter PDFs, sheet counts, warnings, and print/bound previews. Keep existing long/short-edge back-slot mirroring and full-size geometry.
- Keep back content upright after cutting and binding on the refill's left/right edge: when the selected paper flip is horizontal (portrait short-edge or landscape long-edge), rotate back artwork 180° in both exact and imposed output. Compute the axis from actual paper dimensions. Print-sheet preview shows this physical rotation; bound preview shows the readable facing content. This requirement was clarified by Task 1 review of the existing slot-only transform.
- Add a printer margin in mm, presets 0/3/5 and a bounded custom value 0–20 mm, step 0.5. Default 0 preserves existing layouts; clearly state that paper-edge guides may not print. A nonzero margin affects imposition fit and positioning without shrinking any refill. Exact-size output does not validate or use this inactive field.
- Print-sheet previews identify actual page content, blank faces, and page order. Bound preview uses actual duplex faces and explains the chosen binding view. Disable bound mode for single-sided output instead of presenting misleading facing pages.
- Enhance the existing print-size test with paired alignment marks and front/back instructions when duplex is selected. No claim to control printer settings or guarantee physical alignment.

### Dates

- Monthly/yearly retain month ranges and gain useful this/next month/year shortcuts. Weekly/daily gain date-level ranges, retained separately by refill type, with today/next day/this week/next week/4-week/7-day shortcuts as applicable.
- Weekly output includes the whole start/end week. Daily output includes only dates in the selected range and supports all days, weekdays, or explicitly selected weekdays. No selected weekday is an invalid draft with actionable guidance.
- Support 1900-01-01 through 2100-12-31; no more than 60 selected calendar months. Use UTC date-only calculations and local today for shortcut selection. Validate empty/impossible/reversed ranges without clamping during typing.
- Add undated monthly, weekly and daily refills with 1–100 units (a unit may be a spread). Preserve weekday headings, blank date fields, time scale and ruling, but never print synthetic dates, month/year numbers, holiday names, adjacent-month mini calendars or week numbers. Yearly and notes retain their existing dated/pattern behavior. Switching types must not discard previous dated ranges.
- The holiday coverage notice evaluates all dates actually rendered, including weekly boundary spillover. Undated output has no holiday warning or holiday coloring.
- Preserve existing settings JSON and local-storage restore safely. Version-1 files remain importable with their original required-field validation; use a version-2 envelope for new settings. Missing new fields in old records migrate to explicit defaults. Unknown values do not become executable or rendered HTML.

### Choice, navigation and preview

- Preserve desktop settings/preview columns, brand #16624F, and all existing sizes/layouts/appearance features.
- Add inline SVG layout thumbnails with short localized purpose descriptions while preserving radio semantics. No external images/fonts/dependencies.
- Group settings for paper/layout, dates/content, appearance/ring and printing; use compact headings/details rather than a forced wizard.
- On narrow screens show one of Settings / Preview / PDF output through a safe-area-aware bottom bar adapted from `components/mobile-bottom-bar.html`. Preserve field values and focus, avoid duplicate fixed CTAs, horizontal overflow, hidden errors or content obscured by the bar.
- Preview modes: Refill / Print sheets / Bound. Add direct unit/page navigation, a single-page choice for spreads, and accessible enlarged preview with Escape/close/backdrop and internal scrolling. Changing presentation-only options must not invalidate a generated PDF.
- Reuse the same Canvas page renderer for visible undated content and exported PDFs. Existing dated preview contracts can remain where appropriate.
- Add current-page/current-spread trial PDF generation without mutating saved period settings. Label trial output and use a distinct filename suffix. Use the same print planning, paper margins and duplex padding as full output. Prevent stale async results after settings changes or cancellation.
- Add cancellation to large generation and check the existing generation revision between pages so obsolete work stops promptly.

## Constraints and delivery

- Keep all processing local; retain `connect-src 'none'`, single readable and self-extracting HTML, canonical favicon, Japanese/English and file:// operation.
- Do not remove existing functionality. No new runtime dependencies, named profiles, new layout types, arbitrary designer, or edits to Browser Kitty itself.
- Release version 1.1.0. Update APP_SPEC, both READMEs, CHANGELOG and localized in-app help. Regenerate the tracked root standalone using the canonical build, never hand-edit generated artifacts.
- Add meaningful regressions for physical sheet ordering, margins, date boundaries/selection, undated rendering, migration and stale/trial output. Validate desktop and narrow mobile behavior, keyboard/modal operation, PDFs and both standalone variants. Physical printer accuracy remains an explicit unverified limitation.
- Create a PR on the repository and verify its CI. Merge remains the user's action.
