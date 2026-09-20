import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useMe } from "../modules/auth/useMe";
import { EventsListScreen } from "../modules/event/EventsListScreen";
import { MyReportsScreen } from "../modules/incident/MyReportsScreen";
import { IncidentMapScreen } from "../modules/map/IncidentMapScreen";
import { SettingsScreen } from "../modules/settings/SettingsScreen";
import { MyTasksScreen } from "../modules/task/MyTasksScreen";
import { AppTabBar } from "./AppTabBar";

const Tab = createBottomTabNavigator();

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * The active tab is drawn by the icon and label alone — a filled glyph in the brand
 * colour against outlined grey ones — with no background block behind it. That's the
 * "colour the active item" pattern from the navigation reference; the previous
 * tinted rectangle behind the whole tab item looked heavy next to a five-tab bar.
 */
function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

export function MainTabs() {
  const { t } = useTranslation();
  // Per ARCHITECTURE.md §5: meaningless for a bare citizen, since both
  // screens are entirely org-scoped — hidden rather than shown empty.
  const { data: me } = useMe();
  const hasOrganisation = !!me?.organisation;

  return (
    <Tab.Navigator
      // Icon, label and press feedback are drawn by AppTabBar; each screen still
      // supplies its own `title` and `tabBarIcon` for it to read.
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Map"
        component={IncidentMapScreen}
        options={{
          title: t("nav.map"),
          tabBarIcon: tabIcon("location", "location-outline"),
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
          tabBarIcon: tabIcon("document-text", "document-text-outline"),
        }}
      />
      {hasOrganisation ? (
        <Tab.Screen
          name="MyTasks"
          component={MyTasksScreen}
          options={{
            title: t("nav.myTasks"),
            tabBarIcon: tabIcon("checkbox", "checkbox-outline"),
          }}
        />
      ) : null}
      {hasOrganisation ? (
        <Tab.Screen
          name="MyEvents"
          component={EventsListScreen}
          options={{
            title: t("nav.myEvents"),
            tabBarIcon: tabIcon("calendar", "calendar-outline"),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("nav.settings"),
          tabBarIcon: tabIcon("person", "person-outline"),
        }}
      />
    </Tab.Navigator>
  );
}
