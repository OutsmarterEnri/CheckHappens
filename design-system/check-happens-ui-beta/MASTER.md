# Check Happens — UI beta design system

Direction: a pocket board-game lounge. Keep the existing Rooki illustration,
rounded system typeface, six worlds and semantic card colors. Rebuild visual
hierarchy across home, setup, preferences, learning, private invitations, live
table, choices and results with shared surfaces and predictable controls.

Skill research: UI/UX Pro Max design-system search `casual game tactile rounded`
matched Claymorphism (casual games, soft shadows and rounded tactile controls).
Use the style guidance, not the generated marketing-page/testimonial layout.
Keep the existing palettes: the generated pink palette is not a replacement for
our six worlds. React search `touch safe areas` had no match; the retry
`rerender memo` returned rendering guidance, which does not justify new memoization.
Touch decisions use the verified UX `touch target safe area` match and pro-rules.

- One viewport, zero page scroll. Existing 12px phone gutters and opaque,
  safe-area-aware sticky headers remain unchanged.
- 4/8px rhythm, 16–24px radii, restrained soft shadows; no heavy stacked strokes.
- Readable primary text, semantic muted color; verify light and dark separately.
- Primary actions use the world's accent; selected controls have an explicit
  border and checked/pressed semantics. Target 44px for non-board actions.
- Chess squares follow the phone-width board; never pretend a 320px screen can
  fit 44px squares eight across. Preserve destination highlights and labels.
- Home: clear brand, framed mascot on one calm stage, prominent Play, paired
  learning/settings actions. No CHESS + CARDS or default mascot slogan.
- Setup: two compact groups (time/side), local/invite actions, training group.
- Preferences: six collectible theme tiles, clear language/motion rows.
- Learning: same header/surfaces as match, focus on the board and one instruction.
- Match: quiet navigation, unmistakable turn, clear card/move count, strong clocks,
  generous board, immediate action dock. Card colors and effects stay fixed.
- Dialogs: opaque surfaces, clear title/actions, focus handling preserved.
- Motion: short opacity/transform feedback, no layout jumps. Honor system and
  saved reduced-motion settings. Keep the user's mascot half-turn animation.

Delivery: local UI beta only on a separate origin/port, own storage and build
folder. No push, Pages deploy or public tunnel before the user tries it.
