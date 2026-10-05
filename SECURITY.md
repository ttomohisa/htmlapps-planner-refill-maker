# Security Policy

## Supported version

Security fixes target the latest version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include:

- Affected commit or version.
- Reproduction steps.
- Expected and actual behavior.
- Security impact.
- A minimal test file when file parsing is involved.

## Trust model

The default template is a static browser application with no backend. Its primary protections are:

- No ordinary runtime CDN/API connection (`connect-src 'none'`). Optional peer-to-peer WebRTC must be explicit in the product specification and must not introduce hidden signaling/STUN/TURN services.
- Explicitly pinned and embedded third-party files.
- Committed `dependencies.lock.json` tarball SHA-256 values verified before embedding.
- SHA-256 records in the generated dependency manifest.
- No analytics, telemetry, remote fonts, or silent update checks.
- User-initiated downloads rather than automatic uploads.

A generated HTML file is executable code. Distribute it through a trusted channel and verify hashes for high-trust workflows.

If an app uses `components/webrtc-qr-pairing.html`, treat the paired browser as an explicit data recipient. “No server upload” does not mean “data never leaves this device.” Keep the manual signaling and `iceServers: []` boundary visible in the UI/help text, and do not silently add STUN/TURN later.

## Input files

Applications created from this template may parse untrusted local files. Implementations should:

- Validate type, size, and structure before expensive processing.
- Avoid unbounded allocation or recursion.
- Handle malformed data without exposing stack traces to users.
- Release Blob URLs, workers, canvas resources, and large buffers.
- Make destructive transformations reversible where practical.
- Never upload a selected file unless the product explicitly requires it and the user is clearly informed.

### Planner settings boundary

Planner Refill Maker accepts only local, user-selected settings JSON up to 64 KiB. Both the selected file size and decoded UTF-8 size are checked. The fixed app discriminator and format version must match. Required configuration fields are copied through an allowlist and validated for type, bounds, enums, date/hour relationships, colors, and layout/type pairing. Unknown keys, including prototype-shaped keys, never become application state. Imported strings are never rendered as HTML.

The same decoder validates legacy browser storage, allowing missing known settings to use defaults. Derived base dimensions are ignored and recomputed from the built-in named preset or validated Custom dimensions. Invalid records are preserved without an initial autosave overwrite; recovery requires a confirmed import/reset. Storage failures remain visible. Import confirmation does not include or execute arbitrary file metadata, and stale asynchronous work is discarded.

Settings downloads contain configuration only, without PDF bytes, Blob URLs, runtime state, or language preference. Files are not uploaded or fetched. The existing `connect-src 'none'` policy and no-runtime-dependency boundary are unchanged.

## Dependency review

Before adding or upgrading a package:

- Confirm the package identity and exact version.
- Review the scheduled dependency Issue; never treat an available update as an automatic approval to upgrade.
- Review its license and required notices.
- Inspect the browser bundle and package scripts.
- Confirm every runtime support asset is embedded.
- Refresh the selected lock entry with the dependency scripts; never hand-edit a lock hash to bypass a mismatch.
- Rebuild with a clean cache.
- Test with the network disabled.
