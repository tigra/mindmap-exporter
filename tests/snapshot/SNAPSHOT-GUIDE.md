# Mindmap Style Preset Snapshot Testing Guide

This document explains how the style preset snapshot tests work and how to maintain them.

## Purpose of Style Preset Snapshots

The style preset snapshot tests serve as a visual regression testing system that:

1. Ensures each style preset renders consistently across code changes
2. Captures the visual appearance of every layout configuration
3. Verifies that deep node levels (7+) render correctly
4. Provides a reference point for intended visual appearance

## Test Structure

The style preset tests are structured to test each preset in both collapsed and expanded states:

### `style-presets.snapshot.test.js`

This file contains tests for all available style presets. For each preset, it:

1. Generates a mindmap with standardized test content
2. Renders the mindmap in both collapsed and expanded states
3. Captures the SVG output as a snapshot
4. Compares the snapshot to the reference to detect changes

### Test Content

The test markdown includes:

```markdown
# Mindmap Style Testing
## Level 2 Heading
- Level 3 (bullet)
  - Level 4 (bullet)
    - Level 5 (bullet)
      - Level 6 (bullet)
        - Level 7 (bullet)
          - Level 8 (bullet)
## Another Branch
- This helps show branching
  - With some deep children
    - To ensure proper styling
### Level 3 Heading
- With its own bullets
  - And sub-bullets
```

This content ensures:
- Multiple heading levels (1-3)
- Multiple bullet levels (3-8)
- Multiple branches to test layout behavior
- Enough content to thoroughly test styles

## Available Style Presets

The tests automatically discover and test all available style presets:

- `default`: Purple/blue gradients with rounded boxes
- `corporate`: Professional blue tones with square edges
- `vibrant`: Bright, contrasting colors
- `pastel`: Soft, muted colors
- `monochrome`: Black, white, and grays
- `nature`: Organic greens and browns
- `tech`: Dark mode with blue accents
- `retro`: Nostalgic colors with pixelated look
- `minimal`: Clean, simple, mostly white
- `creative`: Artistic colors with rounded shapes

## Interpreting Snapshot Failures

When a snapshot test fails, it means the current SVG output differs from the reference snapshot. This could be due to:

1. **Intentional changes**: You've updated styles or layouts (update the snapshots)
2. **Unintentional changes**: A bug has been introduced (fix the code)
3. **New features**: You've added new functionality (update the snapshots)

The Jest output will show:
- The snapshot file that failed
- A diff showing what changed
- Instructions for updating the snapshot

## Updating Snapshots

When you intentionally change styling, you'll need to update the snapshots:

```bash
npm test -- -u
```

You can also update specific snapshots:

```bash
npm test -- -u tests/snapshot/style-presets.snapshot.test.js
```

## Integration with Layout Types

The integration tests in `layout-styles.test.js` extend the snapshot testing to cover different layout configurations:

- `horizontal-right` 
- `horizontal-left`
- `vertical-down`
- `vertical-up`
- `taproot`
- `classic`
- `vertical-over-taproot`

Each layout is tested with a different style preset to ensure compatibility.

## Deep Node Testing

The integration tests specifically test deep node levels (7-10) with different layout types to ensure:

1. Deep nodes have the correct layout type
2. Deep nodes inherit appropriate styles
3. Connection points are correctly positioned
4. The visual appearance matches expectations

## Best Practices

1. **Review each snapshot failure carefully**: Understand why it failed before updating
2. **Test visual appearance manually**: Verify in browser that the changes look correct
3. **Test all scenarios after changes**: Check both collapsed and expanded states
4. **Keep test content relevant**: The test markdown should cover all needed testing scenarios
5. **Document style changes**: When updating styles, document the changes in code comments