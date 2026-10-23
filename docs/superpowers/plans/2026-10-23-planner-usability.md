# Planner Refill Maker v1.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver the approved first three improvements as a tested PR: dependable printing, visual layout selection/mobile preview, and bounded dated/undated generation.

**Architecture:** Extend the existing single source HTML and its shared Canvas/PDF renderers. Keep logical refill specs separate from padded physical faces, use explicit serializable date/print settings with backwards migration, and keep presentation-only navigation outside export signatures.

**Tech Stack:** Native HTML/CSS/JavaScript/Canvas, the existing PDF writer, Node test harness, canonical PowerShell builders, existing GitHub PR preview workflows.

**Spec:** `docs/superpowers/specs/2026-10-23-planner-usability-design.md`

## Global Constraints

- All user data stays in the browser; retain `connect-src 'none'` and no runtime CDN/font/API dependency.
- Preserve all existing layouts, sizes, ring margins, appearance settings, settings import/export, canonical icon and Japanese/English behavior.
- Output remains `dist/index.html` and `dist/index.self-extract.html`, working from file://; never edit generated HTML manually.
- Keep Browser Kitty #16624F, SVG icons, visible focus, 44 px primary touch targets, safe-area padding and reduced-motion support.
- Physical printer accuracy is not claimed; do not auto-shrink refills or merge the PR.
- New saved settings use formatVersion 2; version-1 imports retain their original validation and migrate with defaults.

## Review Focus

- A left-first spread needs different physical pairing than a right-first one-page refill; test both exact and imposed duplex with odd/even logical counts.
- Legacy saved dates must not silently turn into today's dates; test migration and switching weekly/daily independently.
- Empty active inputs, empty weekday selection, settings imports and A→B→A edits must invalidate full and trial PDFs, including in-flight generation.
- Undated output must contain no synthetic calendar dates or holidays in preview, PDF text drawing or filename; test every monthly/weekly/daily layout.
- Smartphone tab switches, enlarged preview and short-screen Help must keep controls reachable and restore focus without losing settings.

### Task 1: Physical print planning and printer margins

**Files:** Modify `src/index.template.html`, `tests/helpers/planner-harness.mjs`, relevant existing PDF/settings tests; create `tests/print-planning.test.mjs`.

**Interfaces:**
- Consumes: existing `allPageSpecs()`, `pageSpecsForItem()`, `renderPageSpecCanvas()`, state and settings decoder.
- Produces: `printPageSpecs(specs=allPageSpecs())` returning a padded Array of spec/null; `printPageLabel(spec)` returning localized label or blank label; `duplexGroups(specs,slots)` accepting an already prepared print sequence; margin-aware `impositionPlan()`/placement geometry. Helpers are internal application functions, exposed only through the existing test harness adapter.
- Introduce `state.printMarginMm` numeric 0–20 (0.5 step in UI), default 0. New imports save formatVersion 2; v1 uses original required key set and supplies new defaults. Coordinate remaining schema extensions through the same mechanism.

- [x] Write behavior regressions for 2 monthly spreads → `[null,L1,R1,L2,R2,null]`, yearly and weekly-notes equivalents, right/left-start single pages, exact and A4 output counts, and long/short slot correspondence.
- [x] Run the new focused test before implementation and record its expected failures.
- [x] Implement the shared print sequence, counts/blank explanation, margin UI/validation/migration, margin-aware fit, labels and paired size-test alignment marks. Keep old zero-margin geometry with explicit warning; clip crop marks to paper bounds.
- [x] Verify A5/A4 margin0 has 2 slots, margin5 has 1 slot and unchanged refill dimensions; invalid custom margin blocks only active imposed output.
- [x] Run the source test suite, update relevant existing expectations, and commit only task-owned source/tests. Report any stale generated-artifact tests separately for the final canonical rebuild.

### Task 2: Date-level ranges, shortcuts and undated refills

**Files:** Modify `src/index.template.html`, `tests/helpers/planner-harness.mjs`, relevant existing settings/PDF tests; create `tests/date-selection.test.mjs` and `tests/undated-output.test.mjs`.

**Interfaces:**
- Consumes: Task 1 print planning and schema v2 migration.
- Produces: date-aware `viewItems()`/`pageSpecsForItem()` and `isUndated()`; existing Canvas renderer accepts returned undated specs; `state.dateMode` (`dated`/`undated`), `state.undatedCount` (1–100), separate `weeklyStartDate`/`weeklyEndDate` and `dailyStartDate`/`dailyEndDate`, and `dailyWeekdays` (unique integers 0–6). All new state keys participate in validated persistence and PDF freshness. Presentation navigation must remain separate.
- Legacy v1 weekly/daily ranges expand old startMonth/endMonth to their first/last day, preserving prior output. Clean defaults select current week and today/next seven days sensibly, while monthly/yearly retain current app defaults.

- [x] Write failing tests for daily single-day and leap day, weekly cross-month/full-week bounds, separate type ranges, weekday exclusion and empty selection, invalid/reversed/>60-month inputs and supported-year boundaries.
- [x] Implement localized date controls and shortcuts, separate range persistence, and appropriate active-field validation. Keep month controls for monthly/yearly.
- [x] Write failing output tests for all undated monthly/weekly/daily layouts, validating blank date fields and absence of year/month/day numbers, holiday names and week numbers in recorded Canvas text; preserve geometry/ruling/time labels.
- [x] Implement 1–100 undated units, matching previews/PDF, filenames/counts/import summary and date controls. Do not leak placeholder dates into the UI or PDF.
- [x] Fix holiday coverage against actual visible generated dates, test 2027-12 weekly spillover and undated suppression.
- [x] Run focused tests and the source suite, review migration and invalid drafts, and commit source/tests.

### Task 3: Visual layout choice, mobile workflow and preview/trial export

**Files:** Modify `src/index.template.html`, `tests/helpers/planner-harness.mjs`, localized help; create `tests/preview-workflow.test.mjs` and meaningful browser QA where feasible. Read `components/mobile-bottom-bar.html` before adapting it.

**Interfaces:**
- Consumes: Tasks 1/2 logical and physical specs, print geometry, renderer, label helper and validated state.
- Produces: SVG thumbnail radio cards; mobile Settings/Preview/PDF output panels; `previewMode`/preview indexes as ephemeral presentation state; current-unit trial generation through the same export pipeline. `createPdf` should accept explicit scope without changing date settings or allowing a trial/full result to be mislabeled.

- [x] Define behavioral tests for presentation changes retaining a generated PDF, current-unit export using the selected unit and proper padding, trial filename/result labels, cancellation and async stale-output rejection.
- [x] Add compact SVG thumbnails and descriptions, grouped settings, safe-area mobile bottom tabs with preserved fields/focus and active-error routing.
- [x] Complete paper-edge margin selection with 0 / 3 / 5 mm presets and Custom on top of Task 1's numeric field and validation.
- [x] Add Refill/Print sheets/Bound views with real content labels and blank faces; disable Bound in simplex mode. Add direct unit navigation, spread single-page choice, and accessible enlarged preview using a scrollable dialog.
- [x] Add current-page/spread trial output, shared generation cancellation and early revision checks. Preserve editable filenames and distinguish trial/full result status.
- [x] Verify source behavior, desktop/narrow Japanese/English layouts, keyboard and dialog escape/focus; commit source/tests/help.

### Task 4: Release integration, CI and PR

**Files:** Modify `app.config.json`, `APP_SPEC.md`, `README.md`, `README.ja.md`, `CHANGELOG.md`, representative `assets/screenshot*.png`, generated root `planner-refill-maker.html`; keep canonical builders and workflows unless a real failure requires a focused repair.

- [x] Update version to 1.1.0 and align end-user docs/spec/help with implemented behavior and limitations.
- [ ] Run all meaningful source tests and repository syntax/build checks. PowerShell is absent from PATH, but an existing verified installation at `/tmp/browser-kitty-verification/pwsh` supports the canonical local build with a temporary `tar.exe` shim; also confirm the native Windows PR CI.
- [ ] Create a feature branch/PR via the available GitHub connector, preserving remote base tree and all untouched files. Build artifacts stay generated; retrieve or produce them only through the canonical build.
- [x] Inspect the actual preview, generated PDFs and both standalone variants; update screenshots and address concrete visual/functional issues.
- [x] Run task/whole-branch reviews and final checks on the integration tree; record any physical-printer/browser limits honestly.
- [ ] Deliver PR URL, preview URL if available, summary, tests and limitations. Do not merge.
