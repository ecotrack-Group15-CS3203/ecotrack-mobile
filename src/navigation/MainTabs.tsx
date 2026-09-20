import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useMe } from "../modules/auth/useMe";
import { EventsListScreen } from "../modules/event/EventsListScreen";
import { MyReportsScreen } from "../modules/incident/MyReportsScreen";
import { IncidentMapScreen } from "../modules/map/IncidentMapScreen";
import { SettingsScreen } from "../modules/settings/SettingsScreen";
import { MyTasksScreen } from "../modules/task/MyTasksScreen";
import { colors, radii, spacing } from "../theme/colors";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { t } = useTranslation();
  // Per ARCHITECTURE.md §5: meaningless for a bare citizen, since both
  // screens are entirely org-scoped — hidden rather than shown empty.
  const { data: me } = useMe();
  const hasOrganisation = !!me?.organisation;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primaryLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
        },
        tabBarItemStyle: { borderRadius: radii.sm, marginHorizontal: 6, marginVertical: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Map"
        component={IncidentMapScreen}
        options={{
          title: t("nav.map"),
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />
      {/* A real destination — the user's own reports, with the "Report an issue"
          action at the top. It used to be a placeholder whose tab press was
          intercepted to open the same wizard as the map's floating button. The map
          FAB stays (SRS §3.9.1 requires it): it makes a report, this tab tracks them. */}
      <Tab.Screen
        name="Report"
        component={MyReportsScreen}
        options={{
          title: t("nav.report"),
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      {hasOrganisation ? (
        <Tab.Screen
          name="MyTasks"
          component={MyTasksScreen}
          options={{
            title: t("nav.myTasks"),
            tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
          }}
        />
      ) : null}
      {hasOrganisation ? (
        <Tab.Screen
          name="MyEvents"
          component={EventsListScreen}
          options={{
            title: t("nav.myEvents"),
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
      ) : null}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("nav.settings"),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
