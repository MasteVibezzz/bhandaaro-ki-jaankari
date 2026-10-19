# Design review: Bhandaaro Ki Jaankari

## Summary

Baseline: Needs work, with critical accessibility issues. This is a native HTML/CSS/ES-module
website for people seeking and sharing free community meals in Pune. Its single job is to
help someone find a meal and understand the listing's availability. Review uses running UI,
source, and computed sRGB contrast; real VoiceOver and outdoor-device testing remain manual.
Apple's foundations apply; iOS tab bars, native menu bars and Liquid Glass conventions do not.

## Critical

- **Critical — legibility:** original secondary dark text resolves near #818383 on #262828,
  3.89:1, below 4.5:1 at the original 12px supporting-text size. Replace with semantic
  light/dark content tokens and a 16px body / 14px supporting baseline.
  `accessibility.md › Vision`: “Strive to meet color contrast minimum standards.”
- **Critical — keyboard and labels:** original search/select inputs lack persistent labels;
  close controls lack accessible names; dialogs lack focus containment and restoration.
  Add native labels, named dialog regions, visible focus, inert background and keyboard handling.
  `accessibility.md › Speech`: “Let people use the keyboard alone to navigate and interact with your app.”

## Improvements

- **High — hierarchy/navigation:** search, account creation, metrics and map compete; useful
  meal cards require discovering an icon-only toggle. Show list with map on wide layouts,
  use labelled view controls, prioritize search, and place community activity after results.
  `layout.md › Visual hierarchy`: “Order content by relative importance.”
- **High — responsive behavior:** narrow header/filter stacks consume most of the first screen;
  stylesheet hides overflow globally instead of letting content reflow. Use intrinsic grids,
  wrapping controls, 44px targets and full-width compact dialogs; test 320px and 200% text.
  `layout.md › Adaptability`: “Be prepared for text-size changes.”
- **Medium — forms:** name, schedule and map lack clear grouping, while map-only coordinate
  selection excludes keyboard users. Group venue and schedule; offer editable latitude/longitude
  as an alternative; retain existing one-time/regular schedule behavior.
  `entering-data.md › Best practices`: “Be clear about the data you need.”
- **Medium — trust/status:** demo records look like verified live food. Mark demo cards explicitly,
  distinguish schedule states with words as well as color, keep the demo notice visible, and
  avoid claiming recurring schedules are live verified availability.
  `design-principles.md › Responsibility`: “Be fully transparent about what your product does and why.”

## Craft notes and plan

**Judgment:** A community meal board, inspired by the shared steel thali: one plate symbol,
quiet circular details and a marigold invitation to contribute. This belongs to a meal-sharing
product; it avoids the default cream/serif/terracotta treatment. Branding occupies the header
and compact invitation, leaving the food directory central. Remove the colored background
behind the entire filter bank and the competing filled sign-up button.

`branding.md › Best practices`: “Ensure branding always defers to content.”

Tokens, planned before layout implementation (ratios computed using WCAG relative luminance):

| Role | Light | Dark | Contrast |
| --- | --- | --- | --- |
| Canvas / surface | #F6F7F2 / #FFFFFF | #172420 / #1E3028 | Content measured below |
| Content | #192D2A | #EDF2EA | 13.45:1 on canvas / 14.12:1 on dark canvas |
| Supporting content | #586561 | #B6C3BA | 6.09:1 on surface / 7.63:1 on dark surface |
| Link / focus accent | #A74616 | #FFBA72 | 5.95:1 on surface / 8.30:1 on dark surface |
| Serving signal | #1E6948 on #E8F4EB | #8AD6AA on dark surface | 5.86:1 / 8.14:1 |
| Primary invitation | #F2B544 with #192D2A | Same | 7.91:1 |

Type: system sans for body and controls with Devanagari system fallback; the same family in
bold for display, avoiding a font download. Scale: 14 / 16 / 18 / 22 / 32 / fluid 36–56px,
implemented in rem, 1.55–1.7 body leading. Hindi headlines use normal tracking and taller leading.

Layout: search leads to a directory list alongside a quiet map; compact widths use a labelled
map/list switch, preserving all actions. No decorative animation; short color transitions only.

```text
Wide                              Compact
Brand          Find / Community    Brand        Language / Account
Find a meal.        Share a meal    Find a meal.
Search + labelled filters          Search
Result count     Map / List        Filters / Share
Meal cards       Map               Result count     List / Map
Meal cards       Map               Meal cards OR map
Community updates                 Community updates
```

## What works

Keep bilingual content, native select controls, immediate client filtering, guest browsing,
the existing resilient API status/retry, community contributions, and timezone-aware events.
Retain Leaflet attribution and its request-identification/cache policy.

## Platform notes and verification

Use HTML labels, buttons, links and dialogs, CSS media queries and system appearance preferences.
Do not imitate native Apple chrome. Honor reduced motion and increased contrast; use opaque
surfaces so transparency reduction needs no workaround. Verify actual flows in Chrome,
keyboard focus, English/Hindi, light/dark, 320/390/768/1440 widths and 200% text.

## Implemented direction

The initial plan survives the craft check: its shared-plate mark and contribution invitation
belong to this product, while native search/select controls stay familiar. Removed the competing
filled signup action, the filter-bank color block, decorative card lifting, modal blur and
the many unrelated background colors. No ornamental motion is needed. The map follows system
appearance with a CSS treatment limited to the raster tile pane. Popups, controls, attribution
and markers use their own semantic colors, unaffected by the tile filter. Requests and tile
caching still go directly to OSM. This avoids introducing a new tile provider or account.

Follow-up typography correction: use the native `system-ui` stack, standard 600-weight card
headings and normal tracking. Load application CSS after vendor CSS; give Leaflet popup and
control surfaces explicit themed backgrounds. Test open popups in both appearances, including
actual computed foreground/background contrast, rather than testing only closed maps.

The redesigned directory adds directions, explicit demo badges, labelled views and results,
semantic light/dark tokens, scalable type, a skip link, dialog focus containment/restoration,
inert background, keyboard map markers and a numeric coordinate alternative. Confirmed addresses
are preserved when the map selection changes. Ended-event controls and community flows remain.

Automated verification is in `tests/design.mjs`, alongside the existing full-stack browser
regression suite. It checks both languages, 320/390/768/1440 widths, light/dark appearance,
200% text, overflow, view switching, empty-state recovery, labelled controls, visible focus,
dialog keyboard wrap and return focus. Manual browser review checks actual OSM rendering.
VoiceOver announcements and bright-outdoor legibility still need testing on physical devices.
