---
version: alpha
name: Personal navigation
description: A quiet Personal entry that follows the Harness sidebar.
typography:
  label-md:
    fontFamily: system-ui, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
rounded:
  sm: 8px
  md: 12px
---

# Design System

## Overview
Personal is a space containing independent features such as OOPS. Its navigation should be understandable to someone entering from the official sidebar for the first time.

## Colors
Consume the existing `--p-*` semantic aliases of the public Harness theme. Use the raised surface for the menu, secondary text for the disclosure, primary text for destinations. Selection also has a check mark.

## Typography
Inherit the Host font. Use ordinary sidebar label sizing, without display type, web fonts or letter spacing.

## Layout
One vertical sidebar. A single full-width `个人 ▾` control precedes the feature tree. The menu opens below it within the sidebar width. Keep the macOS traffic-light strip and collapsed controls in their established positions.

## Elevation & Depth
Only the open menu is raised. The closed trigger is a quiet sidebar row; it must not resemble a selected tab in a two-tab container.

## Shapes
Use the existing small and medium theme radii. Keep the trigger and menu destinations at least 36px tall for this desktop surface.

## Components
- Space menu: `个人 ▾`; opens `工作` and `个人`, with Personal checked. Selecting Work restores the official workspace; selecting Personal dismisses the menu without resetting the current feature.
- Keyboard: Enter/Space opens, arrows/Home/End move through destinations, Escape closes and returns focus, Tab leaves the menu, clicking outside dismisses it.
- Feature tree: separate from the space menu; selecting or folding features never changes the space.
- Collapsed sidebar: retain the existing expand and return-to-work controls.

## Do's and Don'ts
- Keep the label and person icon recognizable from the official entry.
- Do not introduce a segmented Work/Personal control after entering Personal.
- Do not put interactive controls inside the official icon-only panel slot or rewrite official sidebar DOM.

## Request Anchor
- Request: correct the inconsistent transition from a single Personal entry to a horizontal Work/Personal switch; user suggested a dropdown.
- Deliverable: implemented, installed and visibly checked Personal dropdown.
- Audience/job: current desktop user moving between work sessions and personal features.
- Success: enter Personal, open its named dropdown, return to Work; dismissing or selecting the current space preserves location.
- Preserve: public plugin API, OOPS data, Host source, other sidebar contributions, existing dirty work.
- Non-goals: replacing the official Work sidebar or redesigning OOPS.

## Content Model
The trigger names the current space. Menu labels name destinations. `工作` and `个人` are spaces; `对话` and `画布` are pages inside a feature. A check mark communicates the current space; no explanatory prose is needed in this two-item menu.

## OKF Preflight
Execution: single-agent; this is one localized interaction with shared implementation and acceptance ownership.
Active: information architecture, accessibility/usability, responsive interaction.
Support: principles/index, web-product, content-model, design-contract, visual-verification, quality-gates.
Constraint: the official `sidebar.panellist` owns its button and allows only icon/label contributions. Work therefore retains its ordinary Personal entry. The plugin controls the dropdown inside Personal.

## OKF Decision Bindings
| Reference | Decision | Artifact target | Verification |
|---|---|---|---|
| `design-okf/foundations/information-architecture.md` | Replace two peer buttons with current-space disclosure; keep feature navigation below | `SpaceMenu`, README | Enter from Work, inspect dropdown and return path |
| `design-okf/digital/accessibility-usability.md` | Named menu trigger, checked current destination, visible focus and keyboard dismissal | `SpaceMenu` | Keyboard open, arrows, Escape, current-item selection |
| `design-okf/digital/responsive-interaction.md` | Menu fits sidebar and dismisses on outside interaction; existing collapsed recovery remains | navigation CSS and collapsed controls | Narrow sidebar, outside dismissal, expand/return controls |

## Taste Checkpoint
Clarity-first: one vertical layout family, existing system typography, no new palette. The recognizable element is the person icon followed by the current space and disclosure arrow. Remove the segmented container and its duplicate selected-state styling. Care is expressed through keyboard focus, dismissal and preserving location, without a new animation.

## Quality Gates
Typecheck, unit tests, build, package inspection; rendered closed/open menu, keyboard/outside dismissal, current-item preservation, Work return and Personal re-entry. Native Desktop evidence is separate from component rendering and does not imply Windows/Linux acceptance.

## Assumptions and Open Questions
Assumption: this change belongs to the installed Personal entry. A fully symmetric Work dropdown requires an official interactive space-switch slot, currently unavailable in the inspected Host.

## Review Log
2026-09-30: contract created before implementation. Previous segmented control introduced a second navigation model; replace it with a current-space dropdown. Implemented in 0.2.7. Typecheck, 8 unit tests, build, dshx check and package inspection passed. Pinned Chromium component checks passed in Chinese and English at 320/375/768px: keyboard open/arrows/Home/End, Escape/focus restoration, Tab exit, current-space preservation, outside and iframe dismissal. Saved screenshots and results are in ignored `.local/menu-evidence/`; these use a minimal Host adapter and are component evidence only. Native macOS Desktop separately showed the closed/open menu and keyboard return to Work. The initial iframe-dismiss defect found in live use was repaired with window-blur dismissal. No new animation, model call or data mutation is part of this change. Windows/Linux and native dark mode are unverified. The generic HTML audit was not used against the native Electron app; native screenshots/AX and the pinned component geometry/occlusion checks provide separate evidence without a full HTML-audit claim.

Final native acceptance: 0.2.7 installed and enabled through the official Desktop plugin UI; installed client bytes match the local build. Clicking the real OOPS composer closes the space menu, and reopening it shows Work / Personal with Personal checked. Host PID remained unchanged. Final critique: the segmented-navigation mismatch is removed; the Work entry remains an official panel shortcut under the documented API constraint. No unresolved high-impact findings in the changed menu.
