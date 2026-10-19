# Palette redesign: Bhandaaro Ki Jaankari

## Summary

Overall direction: Good. Keep the accessible community-meal directory and shared-plate identity,
and replace the green/marigold theme with the user's cream, cacao, walnut, stone and teal palette:
https://coolors.co/fbf2c0-48392a-43281c-8c8a93-75b9be.
The visual thesis is a warm meal board with a teal-rimmed thali: approachable, useful and recognisable.
This is an HTML/CSS website; Apple principles apply through native web controls and media queries.

## Review and decisions

- **High — palette contrast:** #8C8A93 on #FBF2C0 is only 3.01:1. Use it for boundaries and
  decorative details, not body copy. `accessibility.md › Vision`: “Strive to meet color contrast
  minimum standards.”
- **Medium — appearance consistency:** update all cards, forms, popups, focus rings, map signals
  and header controls together. `color.md › Best practices`: “Avoid using the same color to mean
  different things.”
- **Medium — dark mode:** use brown surfaces with cream content, teal actions and lighter secondary
  copy. `dark-mode.md › Best practices`: “Ensure that your app looks good in both appearance modes.”
- **Low — restraint:** remove the former green and marigold rather than layering another set of
  accents on top. `branding.md › Best practices`: “Apply your app’s accent color judiciously.”

## Token plan before implementation

The five supplied colors remain the brand anchors; pale surface tints and accessible signal
variants support legibility. Error feedback keeps its distinct semantic color.

| Role | Light | Dark | Measured contrast |
| --- | --- | --- | --- |
| Canvas / cards | #FBF2C0 / #FFFDF3 | #2D1C15 / #43281C | Content measured below |
| Primary content | #43281C | #FBF2C0 | 11.91:1 on cream; 11.91:1 on dark cards |
| Supporting content | #48392A | #D3C5B7 | 10.87:1 on light cards; 7.98:1 on dark cards |
| Primary invitation | #75B9BE with #43281C | Same | 6.06:1 |
| Link / serving signal | #32656A | #75B9BE | 6.43:1 on light cards; 6.06:1 on dark cards |
| Stone boundaries | #8C8A93 | #8C8A93 | 3.01:1 on cream; 3.96:1 on dark cards |

Type stays native system sans: 16px body, 14px supporting text, 20px/600 card titles,
24px/600 section titles, and fluid 36–56px/700 display type. Preserve normal tracking on
cards and taller Hindi leading. Use rem units and retain 200% text support.

Layout stays focused on search, meal cards and map. The map stops at the end of the directory.

```text
Wide:    Brown header → Cream intro + Teal invitation → Search → Cards | Map → Community
Compact: Brown header → Intro → Search + Filters → List / Map → Community
```

**Craft judgment:** cream/brown alone would be a generic rustic treatment. The teal thali rim,
teal contribution action and accessible map signals give this meal-sharing product its own
character without changing familiar navigation. No new imagery, serif type or animation is needed.

## What works and remains

Keep labelled controls, keyboard focus, dialog containment/restoration, bilingual text,
demo badges, directions, one-time events, scoped dark tiles and the corrected sticky-map boundary.
Check computed popup and status contrast, light/dark appearance, 320–1440px widths and 200% text.
