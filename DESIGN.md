---
name: OpenResume Live
description: A compact, local-first resume workbench with live portfolio proof.
colors:
  app-bg: "#0b0d0f"
  ink: "#f5f3ee"
  muted: "#b6bec2"
  line: "#30363a"
  gold: "#d6a84b"
  gold-highlight: "#e7c36a"
  green: "#35b779"
  amber: "#e4a83a"
  red: "#d9534f"
  paper-white: "#ffffff"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(32px, 5vw, 48px)"
    fontWeight: 620
    lineHeight: 1.04
    letterSpacing: "-1.9px"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "21px"
    fontWeight: 680
    lineHeight: 1.2
    letterSpacing: "-0.65px"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace"
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.4px"
  mobile-input:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "5px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "#15130e"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "35px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "35px"
  input-field:
    backgroundColor: "#0d1012"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "37px"
  navigation-active:
    backgroundColor: "#1a2024"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "41px"
  portfolio-surface:
    backgroundColor: "#14171a"
    textColor: "{colors.ink}"
    padding: "0"
---

# Design System: OpenResume Live

## Overview

**Creative North Star: "The Career Analyst Workbench"**

The Career Analyst Workbench treats resume writing as focused, inspectable work: the source content and its live portfolio or resume proof stay close enough to compare at a glance. Its user-approved visual direction draws on the public Rivet financial calculator repository for a compact analyst-workspace sensibility, not as a template to reproduce. Dark zinc surfaces, fine steel rules, and a reserved gold accent keep the interface precise and calm around career content.

Typography stays local-first: system UI and monospace fallback stacks provide a crisp hierarchy without remote font requests or third-party font services. The palette uses gold for action and selection, a clear green save-health signal, amber/orange for in-progress or live markers, and restrained red for error states. The on-screen resume proof remains dark; printing switches to white paper with dark, legible ink. The workbench grid is a concrete editor expression, not a global layout mandate.

**Key Characteristics:**
- Compact, task-focused hierarchy with live proof beside editing.
- Dark zinc tonal layers separated by thin steel rules.
- Gold for primary action and selection; green for saved health; orange-gold for live activity.
- Local system typography and no remote font loading.

## Colors

The palette is a near-black zinc foundation with warm gold accents and quiet, cool text and dividers; functional colors communicate save and error state rather than decoration.

### Primary
- **Workbench Gold**: Primary actions, active section indicators, selected preview mode, and resume section emphasis.
- **Gold Highlight**: Hover and high-contrast accent states, including small live markers.

### Neutral
- **Night Zinc**: Main application canvas and the deepest workspace background.
- **Warm Paper Ink**: Primary text on dark surfaces.
- **Steel Mist**: Secondary copy and supporting labels.
- **Fine Steel**: Panel boundaries, separators, and understated structure.
- **Paper White**: Printed output surface; screen preview remains dark.

### Named Rules
**The Signal-Not-Decoration Rule.** Gold marks action or selection; green means saved and current; amber/orange signals saving or live activity; red is reserved for error or recovery states.

## Typography

**Display Font:** Local system UI stack (`ui-sans-serif`, system UI, platform sans-serif fallbacks)

**Body Font:** The same local system UI stack

**Label/Mono Font:** Local monospace stack (`SFMono-Regular`, Consolas, Liberation Mono, monospace)

**Character:** System UI keeps editing familiar and compact; monospace adds an instrument-like readout for small metadata and utility labels. Both stacks resolve locally and require no network font request.

### Hierarchy
- **Display** (620, `clamp(32px, 5vw, 48px)`, 1.04 line-height): Portfolio proof headline.
- **Headline** (680, 21px, 1.2 line-height): Active editor section heading.
- **Body** (400, 13px base, 1.5 line-height): Interface default and readable copy; controls may use the denser sizes set by their component styles.
- **Label** (400, 9px, 0.4px tracking): Monospace utility labels, counts, and compact metadata.

## Layout

At desktop sizes the editor uses a three-column workbench: a 220px section rail, a flexible editor column with a 330px minimum, and a wider live-preview column with a 460px minimum. At 1120px and 900px, the rail and columns contract to their implemented widths. At 820px and below, the grid becomes a single pane: a horizontally scrollable section rail stays above the editor or preview, and a pane switch exposes the other view. The rail's numeric counts and footer note are hidden on mobile to protect working space.

The rhythm favors compact spacing: 4–8px for control internals, 12–16px between related fields and items, and 24px-scale breathing room around section content. The preview is centered and width-limited on desktop, then fills the available mobile width. Resume and portfolio content retain their own reading hierarchy as the available width narrows.

## Elevation & Depth

Depth is flat and tonal rather than shadow-led. Near-black app, editor, rail, and preview surfaces form quiet layers, while thin rules define panel edges and content sections. The active navigation uses a narrow inset gold marker; focused fields receive a subtle gold focus ring. No ambient card shadows are part of the visual language.

### Named Rules
**The Thin-Rule Structure Rule.** Separate work areas with fine borders and tonal shifts before adding elevation; use focus treatment for interaction, not decoration.

## Shapes

The shape language is mostly square with small, functional corner softening: 4px for fields and section controls, 5px for standard buttons. One-pixel borders carry most component definition. Chips and metadata tags stay compact and rectangular; the tiny round save and live dots are state marks, not a general shape motif.

## Components

### Buttons
- **Character:** Compact utility controls; the primary action is confident and warm, secondary actions stay quiet.
- **Shape:** Gently softened corners (5px); standard height is 35px, with 32px compact buttons.
- **Primary:** Gold fill and dark text (`.button-primary`); horizontal padding is 12px.
- **Hover / Focus:** Primary fill brightens to the gold highlight. Global keyboard focus uses a visible 2px gold-highlight outline with a 3px offset.
- **Secondary / Ghost:** Outline buttons use a fine steel border and dark hover surface; quiet buttons remain borderless until hover.

### Chips
- **Style:** Skill chips use a dark warm tint, thin gold-brown border, and pale gold text.
- **State:** Small outlined sample tags are informational; they are not interchangeable with selected navigation or action buttons.

### Cards / Containers
- **Corner Style:** The portfolio proof frame is square-edged; editor entry blocks use fine borders rather than lifted cards.
- **Background:** The portfolio frame sits on a dark zinc surface; the editor remains slightly distinct from its parent canvas.
- **Shadow Strategy:** Flat tonal layering only; see Elevation & Depth.
- **Border:** Fine steel rules frame the proof and separate its content sections.
- **Internal Padding:** Editor blocks use compact 13px insets; preview content uses wider, reading-oriented padding that contracts on mobile.

### Inputs / Fields
- **Style:** Dark field surface, 1px steel border, and 4px corners; inputs are 37px high, with multiline fields growing from an 87px minimum.
- **Focus:** Gold border and a subtle 2px outer gold ring.
- **Touch layouts:** Inputs use a 16px type size to remain legible and avoid automatic focus zoom on iOS.
- **Error / Disabled:** Disabled buttons visibly reduce opacity; save recovery and unavailable states use the error signal.

### Navigation
- **Style:** The section rail uses compact text-and-icon rows, subdued by default. Active desktop navigation gains a dark tonal fill and narrow inset gold stripe.
- **Mobile:** At 820px and below, sections become a horizontally scrolling rail; the active marker moves to the bottom edge and the editor/preview switch controls the visible pane.

### Live Workbench
The desktop editor and portfolio/resume proof share a three-column workbench. A green dot signals saved/up-to-date health, amber indicates saving, and small gold-orange dots identify live editing and preview activity. The on-screen resume view keeps the dark palette; print rules hide the workbench controls and render the document on white paper with dark text and subdued ochre accents.

## Motion

Motion clarifies the editor's state changes: a brief section arrival orients section navigation, the preview proof settles into view when its format changes, and mobile pane transitions preserve the spatial relationship between editing and previewing. Effects are short, use transform/opacity and a bounded clip reveal, and are disabled for reduced-motion preferences. Typing, autosaving, and ordinary content updates do not trigger entrance animations.

## Do's and Don'ts

### Do:
- **Do** use the documented gold for primary actions and active states, and preserve the distinct green saved/up-to-date signal.
- **Do** use the local system UI and monospace fallback stacks; keep typography independent of remote font services.
- **Do** create structure with tonal surfaces and thin rules before considering shadow.
- **Do** retain the dark on-screen preview and the white-paper print transformation where resume output is involved.
- **Do** treat the three-column editor as the current workbench expression, not as a mandatory layout for every future surface.

### Don't:
- **Don't** load remote fonts; this product's typography is intentionally local-first.
- **Don't** use green as a generic accent or gold as a substitute for saved-state feedback.
- **Don't** turn routine panel separation into heavy borders, gradients, or ambient shadows.
