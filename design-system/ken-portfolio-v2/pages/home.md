# Home Page Override

This file overrides `../MASTER.md` for the portfolio homepage. The accepted
4 + 1 concept is the source of truth when it conflicts with generated defaults.

## Direction

- Concept: architectural system map + Swiss editorial portfolio.
- Background: true white `#FFFFFF`; do not substitute cream or warm gray.
- Container: open layout with hairline rules, bands, rails, and diagrams.
- Density: spacious. Avoid card grids, glass panels, pills, and decorative UI.
- Personality: precise, curious, human, and commercially credible.

## Tokens

| Token | Value |
|---|---|
| Ink | `#111111` |
| Paper | `#FFFFFF` |
| Cobalt | `#1F4EFF` |
| Signal orange | `#FF5A2F` |
| Muted ink | `#5E5E5E` |
| Hairline | `#D9D9D9` |
| Soft surface | `#F6F6F3` |
| Focus ring | `#1F4EFF` |

Use `Instrument Serif` for editorial display headings, `Barlow Condensed` for
large system labels and numbers, and `Inter` for body and UI text.

## Page Order

1. Quiet sticky navigation
2. Connector hero with interactive system map
3. Evidence rail
4. Selected work
5. Experience timeline
6. Capability system
7. Technical labs
8. Beyond the system
9. Ask Ken
10. Contact band

## Above-the-Fold Copy Lock

- Brand: `KEN LIAO`
- Navigation: `Systems`, `Work`, `Experience`, `About`, `Connect`
- H1: `KEN LIAO — THE CONNECTOR`
- Supporting copy: `I connect business intent, product decisions, technology, delivery, and growth into systems that work.`
- System nodes: `Business`, `Product`, `Technology`, `Delivery`, `Growth`
- Chat node: `Ask Ken`

Do not add an eyebrow, badge, status chip, fake metric, or secondary CTA above
the fold.

## Typography

- Hero H1: Barlow Condensed 700, uppercase, tight tracking, responsive
  `clamp(4.5rem, 9vw, 9.5rem)`.
- Section headings: Instrument Serif 400, responsive
  `clamp(3rem, 6vw, 6.5rem)`.
- Body: Inter 400, 16–20px, line-height 1.6.
- Labels: Inter 600, 11–13px, uppercase, letter-spacing 0.12em.
- UI controls: Inter 500, minimum 14px.

## Connector Map

- Render as code-native SVG inside one React Island.
- Use Ken's existing profile image at the hub.
- Every node is a real button with an accessible name and visible focus ring.
- Selected node uses cobalt stroke and updates the adjacent detail copy.
- Keep all essential labels visible without hover.
- On narrow screens, replace the radial geometry with a horizontal/vertical
  list using the same node buttons and selected state.
- Animate the HTML wrapper around the SVG, not the SVG element itself.

## Project Rows

Use three editorial rows, not cards:

1. `Archi — Verifiable Portfolio Guide`
2. `CTSS Taiwan — Localized Recruitment Platform`
3. `STRATOS PM — Planning System`

Each row contains Problem, Decision, System, Outcome, role, image, and link.
Do not invent quantified outcomes. CTSS may use the verified public result:
more than 100 document reviews and nearly 30 interviews from 2025/06–2026/07.

## Experience and Capability

- Experience dates and employers:
  - `2023—Now`, `eCloudvalley`, `Digital Transformation Systems Analyst`
  - `2021—2023`, `Acer`, `Project Engineer`
- Capability lanes:
  - `SA / Systems Analysis`
  - `PM / Product & Delivery`
  - `AWS / Cloud Architecture`
  - `AI / Automation`
- Never use percentage skill bars.

## Motion

- Use Motion for React only for the interactive island and section reveals.
- Enter duration: 320–520ms with ease-out.
- Hover duration: 160–220ms; transform/opacity only.
- Animate at most one or two focal elements per viewport.
- No scroll-jacking, pinned sections, cursor followers, or decorative parallax.
- Disable non-essential motion under `prefers-reduced-motion: reduce`.

## Icon Inventory

Use Lucide outline icons at 1.5px stroke for navigation utilities, capability
nodes, links, and Chatbot actions. The central system map may use custom SVG
geometry but not custom icon metaphors when a matching Lucide icon exists.

## Chatbot

- Keep the existing AWS Lambda-backed widget behavior and knowledge base.
- Rename the visible assistant to `Ask Ken`.
- Do not auto-open on page load.
- Quick actions: `Introduce Ken`, `Recommend a project`,
  `How does Ken approach systems?`
- Loading, timeout, offline, and visible keyboard focus states are required.

## Accessibility and Performance

- Add a skip link and sequential heading hierarchy.
- Minimum touch target: 44 × 44px.
- Preserve visible focus on every control.
- Defer analytics, Clarity, and Chatbot scripts until after first paint.
- Hydrate only the Connector map. Keep the rest server-rendered/static.
- Test at 375, 768, 1024, and 1440px without horizontal overflow.
