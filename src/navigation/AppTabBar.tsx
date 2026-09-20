import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../theme/colors";

/** Space above the icons, and below the labels *on top of* the system inset. */
const PADDING_TOP = 10;
const PADDING_BOTTOM = 8;
/** Icon (24) + a little air + gap + label (~14). */
const ICON_AREA_HEIGHT = 30;
const CONTENT_HEIGHT = ICON_AREA_HEIGHT + 2 + 14;

/**
 * The bottom tab bar. Replaces the stock one so that it owns its own geometry: the
 * stock item paints a large grey press ripple across the whole tab — icon and label
 * — which looked heavy, and there is no press feedback here beyond a brief dim.
 *
 * It also owns the bar's height. An explicit height replaces the library default,
 * which is what added the bottom safe-area inset; leaving it out let the system
 * gesture bar sit on top of the labels, so the inset is added back here.
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          height: PADDING_TOP + CONTENT_HEIGHT + PADDING_BOTTOM + insets.bottom,
          paddingTop: PADDING_TOP,
          paddingBottom: PADDING_BOTTOM + insets.bottom,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textMuted;
        const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? route.name);

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        function onLongPress() {
          navigation.emit({ type: "tabLongPress", target: route.key });
        }

        return (
          <Pressable
            key={route.key}
            // A dim, not a ripple: enough that a tap doesn't feel dead.
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            accessibilityState={{ selected: focused }}
          >
            <View style={styles.iconArea}>{options.tabBarIcon?.({ focused, color, size: 24 })}</View>
            <Text style={[styles.label, focused && styles.labelFocused, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconArea: {
    height: ICON_AREA_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: spacing.xs / 2,
    fontSize: 11,
    fontWeight: "600",
  },
  labelFocused: {
    fontWeight: "700",
  },
});
