import { useState } from "react";
import { Image, StyleSheet, View, DimensionValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { radii } from "../theme/colors";
import { thumbFill } from "../theme/thumbFills";

type Props = {
  /** The entity id — the same id always gets the same fill. */
  seed: string;
  /** A photo, when there is one. Falls back to the fill if it fails to load. */
  uri?: string | null;
  width?: DimensionValue;
  height: number;
  radius?: number;
  /** Watermarked over the fill. */
  icon?: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
};

/** A photo where we have one, a deterministic tinted tile where we don't — the web's
 * `TableThumb`. `children` render on top (a DateTile over an event's header band). */
export function ThumbPlaceholder({
  seed,
  uri,
  width = "100%",
  height,
  radius = radii.sm,
  icon = "leaf-outline",
  children,
}: Props) {
  const [failed, setFailed] = useState(false);
  const fill = thumbFill(seed);
  const showImage = !!uri && !failed;

  return (
    <View style={[styles.tile, { width, height, borderRadius: radius, backgroundColor: fill.base }]}>
      {showImage ? (
        <Image source={{ uri }} style={styles.image} onError={() => setFailed(true)} resizeMode="cover" />
      ) : (
        <Ionicons
          name={icon}
          size={Math.round(height * 0.9)}
          color={fill.accent}
          style={styles.watermark}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  // Clipped off the bottom-right corner so it reads as texture, not as a logo.
  watermark: {
    position: "absolute",
    right: -12,
    bottom: -14,
    opacity: 0.35,
  },
});
