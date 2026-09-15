import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useMe } from "../modules/auth/useMe";
import { EventsListScreen } from "../modules/event/EventsListScreen";
import { IncidentMapScreen } from "../modules/map/IncidentMapScreen";
import { SettingsScreen } from "../modules/settings/SettingsScreen";
import { MyTasksScreen } from "../modules/task/MyTasksScreen";
import { colors, radii } from "../theme/colors";
import { ReportPlaceholderScreen } from "./placeholders/ReportPlaceholderScreen";

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
      <Tab.Screen
        name="Report"
        component={ReportPlaceholderScreen}
        options={{
          title: t("nav.report"),
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Report is a FAB, not a real tab destination: it pushes a modal
            // on the parent stack instead of switching the active tab.
            e.preventDefault();
            navigation.getParent()?.navigate("ReportModal");
          },
        })}
      />
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
