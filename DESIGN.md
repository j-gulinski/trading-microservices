---
name: Trading Microservices
description: A compact live trading and risk console built for clean operational scanning.
colors:
  canvas: "#0b0d12"
  sidebar: "#0d1017"
  panel: "#12161e"
  panel-hover: "#181e28"
  elevated: "#151a23"
  border: "#252c38"
  border-strong: "#394455"
  text-primary: "#eef1f7"
  text-secondary: "#a5adba"
  text-muted: "#7f8b9a"
  signal-violet: "#9788ee"
  signal-violet-strong: "#aa9df3"
  signal-violet-wash: "rgba(151, 136, 238, 0.13)"
  market-green: "#52cf8c"
  risk-red: "#ef747f"
  latency-amber: "#e8b45b"
  stream-blue: "#6aa6e8"
  button-text: "#0b0d12"
  shadow-ink: "rgba(0, 0, 0, 0.32)"
  shadow-ink-soft: "rgba(0, 0, 0, 0.28)"
typography:
  metric-large:
    fontFamily: '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace'
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  display:
    fontFamily: '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace'
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  section-title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  subheading:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.12em"
  control:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  data:
    fontFamily: '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  micro:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.12em"
rounded:
  tight: "4px"
  sm: "6px"
  md: "10px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-violet}"
    textColor: "{colors.button-text}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.signal-violet-strong}"
    textColor: "{colors.button-text}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.risk-red}"
    textColor: "{colors.button-text}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-primary}"
    typography: "{typography.data}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "36px"
  chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  chip-selected:
    backgroundColor: "{colors.signal-violet-wash}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  navigation-active:
    backgroundColor: "{colors.signal-violet-wash}"
    textColor: "{colors.signal-violet}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px"
---

# Design System: Trading Microservices

## Overview

**Creative North Star: "The Live Risk Console"**

The system is a clean, informative, readable, and modern operator workspace. It improves the existing dark trading-console base through disciplined hierarchy and consistency rather than replacing its identity. Live values, service health, and actionable controls should be legible at a glance without making the interface feel theatrical.

The aesthetic is compact, calm, and exact. Near-black tonal surfaces establish a quiet field; fine borders organize dense content; violet identifies navigation, selection, and primary action; monospace numerals make changing values easy to compare. Expression comes from precise state feedback and unusually careful information design, not decorative effects.

**Key Characteristics:**

- Near-black tonal layers with fine cool-neutral borders.
- Compact, information-dense layouts built for continuous scanning.
- Restrained violet for identity, selection, focus, and primary action.
- Semantic green, red, amber, and blue reserved for operational state.
- System sans-serif for interface language and monospace for live data.
- Flat surfaces at rest; shadows appear only when an overlay must separate spatially.

## Colors

The palette is a cool graphite system animated by a softened ultraviolet and a small set of unambiguous operational colors. Its hues are deliberately tuned away from framework-default purple, green, red, amber, and blue.

### Primary

- **Signal Violet** (`#9788ee`): Brand mark, active navigation, focus rings, selected controls, links, and primary actions.
- **Strong Signal Violet** (`#aa9df3`): Brighter hover reinforcement for primary actions, never a second competing accent.
- **Signal Violet Wash** (`rgba(151, 136, 238, 0.13)`): Selected rows, active chips, toggles, and navigation backgrounds where solid violet would be too loud.

### Secondary

- **Market Green** (`#52cf8c`): Positive PnL, healthy services, connected streams, and buy-side confirmation.
- **Risk Red** (`#ef747f`): Negative PnL, service failures, rejected actions, destructive controls, and validation errors.
- **Latency Amber** (`#e8b45b`): Degraded services, warnings, delayed processing, and thresholds needing attention.
- **Stream Blue** (`#6aa6e8`): Informational and live-stream states that are neither success nor failure.

### Neutral

- **Console Canvas** (`#0b0d12`): The application background and recessed form fields.
- **Sidebar Black** (`#0d1017`): Persistent navigation and panel-header framing.
- **Panel Graphite** (`#12161e`): Primary card, table, and container surface.
- **Hover Graphite** (`#181e28`): Hover feedback and compact raised state.
- **Elevated Graphite** (`#151a23`): Controls and small nested surfaces that need tonal separation.
- **Quiet Border** (`#252c38`): Default dividers, table rules, and container outlines.
- **Strong Border** (`#394455`): Hover, overlay, and emphasized separation.
- **Primary Text** (`#eef1f7`): Headings, values, and essential interface content.
- **Secondary Text** (`#a5adba`): Supporting labels, inactive controls, and explanatory text.
- **Muted Text** (`#7f8b9a`): Metadata, timestamps, group labels, and intentionally recessive copy with readable small-text contrast.
- **Button Ink** (`#0b0d12`): High-contrast text on solid semantic or violet actions.

**The Signal Rarity Rule.** Violet marks identity, selection, focus, and primary action; it is not ambient decoration.

**The State Color Rule.** Green, red, amber, and blue always communicate operational meaning and never serve as arbitrary ornament.

## Typography

**Display Font:** SF Mono / JetBrains Mono (with platform monospace fallbacks)  
**Body Font:** system UI (with Segoe UI, Roboto, and sans-serif fallbacks)  
**Label/Mono Font:** SF Mono / JetBrains Mono (with platform monospace fallbacks)

**Character:** The pairing is utilitarian and contemporary. The system sans-serif keeps controls and navigation familiar, while monospace gives live values, identifiers, timestamps, and PnL the measured cadence of an operator console.

### Hierarchy

- **Large Metric** (600, `26px`, `1`): The largest service-latency and focused operational readouts.
- **Display** (600, `24px`, `1.1`): High-value KPIs, PnL summaries, and major latency readouts; use monospace and tabular numerals where values update.
- **Headline** (600, `20px`, `1.5`): Page titles in the persistent top bar.
- **Title** (600, `18px`, `1.5`): Side-panel and focused workflow headings.
- **Section Title** (600, `16px`, `1.5`): Prominent subsection headings that sit below the page title.
- **Subheading** (600, `15px`, `1.5`): Book names, compact brand titles, and card-level headings.
- **Body** (400, `14px`, `1.5`): Default interface copy, explanations, and general labels.
- **Label** (500, `11px`, `0.12em`, uppercase): Section headings, table headings, card labels, and compact operational categories.
- **Control** (600, `13px`, `1.5`): Primary buttons and consequential actions.
- **Data** (400, `13px`, `1.5`): Prices, quantities, identifiers, timestamps, and tabular metrics.
- **Caption** (400, `12px`, `1.5`): Supporting notes, subtitles, compact controls, and secondary table context.
- **Micro Label** (500, `10px`, `0.12em`, uppercase): The smallest group labels, badges, and metadata categories.

**The Numbers Speak Mono Rule.** Any value users compare across rows, time, or state uses the monospace stack and tabular numerals when supported.

**The Labels Whisper Rule.** Sentence case carries navigation and section hierarchy. Uppercase is reserved for terse telemetry, table columns, and explicit state words.

## Layout

The workspace uses a persistent left rail and a flexible content column. The sidebar is `210px` wide and collapses to `60px`; at `760px` and below it becomes a fixed `60px` icon rail so the working surface remains usable. The main page uses `32px` horizontal and bottom padding on wide screens and `16px` horizontal padding on compact screens, while top bars use `24px 32px` and reduce to `16px` on compact screens. The base rhythm is a `4px` scale, with `12px` and `16px` doing most local composition work and `24px` to `32px` separating regions.

Service health uses a shared matrix surface, and related KPIs use divider-defined metric rails rather than nested cards. Cards are reserved for real domain objects such as books and focused task containers. Tables preserve comparable columns and move to horizontal scrolling instead of fragmenting rows into unrelated mobile cards.

Drawers are focused task workspaces. Standard and wide panels occupy `440px` and `620px`, contain keyboard focus while open, and push desktop content aside; at `900px` and below they become full-viewport overlays. Toolbars reflow near `960px`, and compact control groups stack near `620px`.

**The Desktop Density Rule.** Preserve useful information density on wide screens, then reflow groups at bounded breakpoints; do not enlarge every control merely because space exists.

**The Container Hierarchy Rule.** Use proximity and dividers for related measurements; introduce a bordered card only when the content is a distinct object, task, table, or stateful region.

## Elevation & Depth

The system is flat by default. Depth comes primarily from near-black tonal changes and one-pixel borders, not from persistent card shadows. Shadows are reserved for spatial overlays: the fixed side panel uses a broad lateral shadow (`-24px 0 64px rgba(0, 0, 0, 0.32)`), and floating menus use a compact ambient shadow (`0 14px 36px rgba(0, 0, 0, 0.28)`). Inset violet or blue rules communicate selection and drag placement without implying physical elevation.

Motion is brief and functional: most control feedback runs at `120–160ms`, while panels and layout shifts use roughly `200–220ms`. Reduced-motion preferences remove nonessential entrance, row-flash, and layout transitions.

### Shadow Vocabulary

- **Panel Separation** (`-24px 0 64px rgba(0, 0, 0, 0.32)`): Separates a task drawer from the pushed or covered workspace.
- **Floating Menu** (`0 14px 36px rgba(0, 0, 0, 0.28)`): Keeps a compact popup legible above dense tables and controls.

**The Flat by Default Rule.** Cards and tables stay border-defined at rest; a shadow must explain an actual overlay relationship.

## Shapes

The form language is compact and gently squared. Controls use a small `6px` radius, panels and cards use a medium `10px` radius, and tightly nested segments may use `4px`. Fully rounded `999px` geometry is reserved for chips, status pills, counters, and toggles. Most surfaces retain a visible one-pixel border; borderless shapes are reserved for primary actions or controls nested inside an already bounded group.

**The Two Radius Rule.** Use `6px` for controls and `10px` for containers; introduce a pill only when the element is genuinely chip-like or status-like.

## Components

Components feel compact, calm, and exact—optimized for scanning live operational data. Every interactive state must remain visible against the dark field, and focus treatment uses the same signal violet as selection.

### Buttons

- **Shape:** Gently squared (`6px`) with compact heights from `32px` to `40px` according to consequence and context.
- **Primary:** Solid Signal Violet with Button Ink text, bold control typography, and restrained horizontal padding.
- **Hover / Focus:** Hover moves to Strong Signal Violet; keyboard focus uses a `2px` Signal Violet outline with positive offset.
- **Secondary:** Panel Graphite with a Quiet Border and Secondary Text; hover strengthens both border and text.
- **Danger:** Solid Risk Red for confirmation or a transparent red-bordered treatment for secondary destructive actions.

### Chips

- **Style:** Fully rounded, compact, and reserved for interactive filtering or operational status—not ordinary metadata or counts.
- **State:** Unselected chips use Panel Graphite and Secondary Text; selected chips use a Signal Violet border and wash with Primary Text.

### Cards / Containers

- **Corner Style:** Medium gently squared corners (`10px`).
- **Background:** Panel Graphite over Console Canvas, with Elevated Graphite used only for nested elements.
- **Shadow Strategy:** Flat at rest; see Elevation & Depth for overlay exceptions.
- **Border:** One-pixel Quiet Border. Related metrics share one container and use internal dividers; semantic color should usually tint text or state rather than create another box.
- **Internal Padding:** Usually `16px`; dense headers may use `12px 16px`.

### Inputs / Fields

- **Style:** Recessed Console Canvas or Elevated Graphite, one-pixel Quiet Border, `6px` radius, and monospace text for quantities and identifiers.
- **Focus:** A `2px` Signal Violet outline for form fields, or a Signal Violet border shift for compact generator controls.
- **Error / Disabled:** Invalid fields use a translucent Risk Red border; disabled fields reduce opacity without changing their semantic content.

### Navigation

The persistent sidebar uses `13px` interface text and simple `16px` line icons. Default items are quiet and borderless; hover introduces Hover Graphite and Primary Text; the active route uses a Signal Violet wash with violet text. Group labels are compact uppercase labels. Collapsed and compact-screen navigation preserves accessible names, icons, tooltips, a compact brand mark, and stream status while removing visible text labels.

### Data Tables

Tables use Panel Graphite, one-pixel horizontal rules, compact `12px` cell padding, and uppercase `11px` column labels. Numeric and temporal cells use monospace and right alignment. Hover is tonal, selected rows use a violet wash plus a `2px` inset violet marker, and live positive or negative flashes are brief and disabled under reduced-motion preferences.

### Status Pills

Status pills combine a small circular marker, uppercase `10–11px` label, semantic foreground, and a translucent background of the same meaning. Health, freshness, severity, and live-stream states share geometry but retain distinct labels so color is never the only signal.

### Side Panels

Task panels enter from the right, maintain a fixed desktop width, and become full-viewport below `900px`. A darker header and footer frame a scrollable body; wide variants support data-heavy trade detail. Entrance motion lasts `200ms` and is removed for reduced-motion users.

**The Honest State Rule.** Every live, stale, unavailable, destructive, selected, and disabled condition keeps a visible text or structural cue in addition to color.

## Do's and Don'ts

### Do:

- **Do** use the `4px` spacing scale and favor `12px` or `16px` gaps inside dense working regions.
- **Do** reserve monospace for values, identifiers, timestamps, and other content users compare.
- **Do** preserve clear text labels alongside semantic status colors.
- **Do** keep violet scarce enough that active navigation, focus, and primary action remain obvious.
- **Do** use borders and tonal surfaces before reaching for shadow.
- **Do** use sentence case for structural headings and reserve uppercase for telemetry.

### Don't:

- **Don't** turn the console into a decorative neon, glass, or gradient-heavy trading stereotype.
- **Don't** use green, red, amber, or blue without an operational meaning.
- **Don't** apply large rounded corners or pill geometry to ordinary cards, tables, and panels.
- **Don't** increase whitespace until related values can no longer be scanned as a group.
- **Don't** wrap metadata, counts, and every metric in independent pills or cards.
- **Don't** replace comparable table rows with disconnected card layouts on smaller screens; preserve structure and allow bounded horizontal scrolling.
