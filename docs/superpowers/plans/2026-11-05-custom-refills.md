# Custom refills implementation plan

Use the existing Canvas renderer for preview and PDF, and the existing page planner for both new spreads. Keep the v1/v2 settings decoder and add a validated v3 customization record with compatible defaults.

1. Add behavior tests for spread order, custom spacing, section selection and date annotations.
2. Add grouped, localized settings and validate both active drafts and saved data.
3. Render daily and weekly variants, vertical monthly lists and personal dates through shared Canvas code. Preserve physical margins and millimeter spacing.
4. Update the help, release metadata and READMEs, then verify the canonical builds and representative browser/PDF outputs.
