# Slice S0 · Archive decisions, visuals and roadmap

**Status:** Prepared for independent review · documentation-only.

## Scope

Preserve the eight visual concepts shown in October 23 discussion in editable, self-contained SVG. Record accurate Markdown equivalents, product decisions, architecture boundary and implementation roadmap. Deliver a local transferable folder and open an unmerged PR to staging repository.

## Acceptance criteria

- All eight SVGs render without external network/resources and contain title + description.
- PNG local previews render correctly; no nonportable font dependency.
- Tables use realistic labels and identify demonstration values as fictional.
- Documentation explicitly distinguishes proposed features from deployed features.
- GitHub changes occur only on `feat/*` branch, with no live dashboard modifications.
- PR contains link to files and clear next slice; no automatic merging.

## Exclusions

No UI code, scheduler, new board, production secret, automatic outreach, or actual gig sourcing.

## Reviewer checks

Inspect every SVG visually; verify Markdown count/weights; check README links; verify no secret or personal data; verify PR diff contains only new documentation assets.
