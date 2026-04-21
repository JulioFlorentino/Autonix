import { Platform } from "react-native";

export const Palette = {
  orange: "#FF7A1A",
  orangeDark: "#E56500",
  black: "#0D0D0D",
  whiteSoft: "#F5F5F5",
  grayLight: "#D9D9D9",
  grayMid: "#8A8A8A",
  blueDeep: "#1E3A5F",
  bluePetrol: "#0F4C5C",
  green: "#2ECC71",
  red: "#E74C3C",
  gold: "#FFC857",
} as const;

export const Colors = {
  light: {
    text: "#0D0D0D",
    background: "#F5F5F5",
    tint: "#FF7A1A",
    icon: "#8A8A8A",
    tabIconDefault: "#8A8A8A",
    tabIconSelected: "#FF7A1A",
  },
  dark: {
    text: "#F5F5F5",
    background: "#0D0D0D",
    tint: "#FF7A1A",
    icon: "#8A8A8A",
    tabIconDefault: "#8A8A8A",
    tabIconSelected: "#FF7A1A",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
