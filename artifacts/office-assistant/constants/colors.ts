/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#172033',
    tint: '#2F6BFF',

    // Core surfaces
    background: '#F6F8FC',
    foreground: '#172033',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#172033',

    // Primary action color (buttons, links, active states)
    primary: '#2F6BFF',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EAF0FF',
    secondaryForeground: '#214BC0',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF2F7',
    mutedForeground: '#6B7485',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFF2D8',
    accentForeground: '#9A6100',

    // Destructive actions (delete, error states)
    destructive: '#D94747',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#E2E7F0',
    input: '#D9E0EC',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
