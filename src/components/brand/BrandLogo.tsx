import { Image, ImageStyle, StyleProp } from "react-native";

/** "light" is the mark for light surfaces; "dark" carries a white rim so its
 * dark outline still reads on the brand's dark green. */
export type BrandTone = "light" | "dark";

const SOURCES = {
  light: require("../../../assets/brand/logo-mark.png"),
  dark: require("../../../assets/brand/logo-mark-dark.png"),
} as const;

type Props = {
  size?: number;
  tone?: BrandTone;
  style?: StyleProp<ImageStyle>;
};

/** The EcoTrack hexagon mark. Square box, mark centred — pass the box size.
 * Decorative by default: pair it with visible text (the wordmark) or give the
 * surrounding element the accessible name. */
export function BrandLogo({ size = 40, tone = "light", style }: Props) {
  return (
    <Image
      source={SOURCES[tone]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
