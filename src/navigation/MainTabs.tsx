import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

import { MapScreen } from "./placeholders/MapScreen";
import { MyEventsScreen } from "./placeholders/MyEventsScreen";
import { MyTasksScreen } from "./placeholders/MyTasksScreen";
import { ReportPlaceholderScreen } from "./placeholders/ReportPlaceholderScreen";
import { SettingsScreen } from "./placeholders/SettingsScreen";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapScreen} options={{ title: t("nav.map") }} />
      <Tab.Screen name="MyTasks" component={MyTasksScreen} options={{ title: t("nav.myTasks") }} />
      <Tab.Screen
        name="Report"
        component={ReportPlaceholderScreen}
        options={{ title: t("nav.report") }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Report is a FAB, not a real tab destination: it pushes a modal
            // on the parent stack instead of switching the active tab.
            e.preventDefault();
            navigation.getParent()?.navigate("ReportModal");
          },
        })}
      />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} options={{ title: t("nav.myEvents") }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t("nav.settings") }} />
    </Tab.Navigator>
  );
}
