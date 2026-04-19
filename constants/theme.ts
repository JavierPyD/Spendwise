import { Platform } from 'react-native';

// ── SpendWise Palette ────────────────────────────────────────────────────────
export const Palette = {
  navyDeep:    '#0D1E4C',  // primary dark / headers
  navyMid:     '#26415E',  // secondary dark / cards
  navyDark:    '#0B1B32',  // darkest background
  blueAccent:  '#83A6CE',  // interactive / buttons
  rose:        '#C48CB3',  // highlight / accent
  blush:       '#E5C9D7',  // light surfaces / subtle bg
  white:       '#FFFFFF',
  offWhite:    '#F4EEF2',  // light mode background
  success:     '#4ECDC4',
  warning:     '#F7B731',
  danger:      '#E84393',
  textDark:    '#0B1B32',
  textMid:     '#26415E',
  textLight:   '#83A6CE',
  textMuted:   '#C48CB3',
};

export const Colors = {
  light: {
    text:           Palette.textDark,
    background:     Palette.offWhite,
    tint:           Palette.navyDeep,
    icon:           Palette.navyMid,
    tabIconDefault: Palette.blueAccent,
    tabIconSelected:Palette.navyDeep,
    card:           Palette.white,
    accent:         Palette.blueAccent,
    rose:           Palette.rose,
  },
  dark: {
    text:           Palette.blush,
    background:     Palette.navyDark,
    tint:           Palette.blueAccent,
    icon:           Palette.blueAccent,
    tabIconDefault: Palette.blueAccent,
    tabIconSelected:Palette.rose,
    card:           Palette.navyMid,
    accent:         Palette.blueAccent,
    rose:           Palette.rose,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
