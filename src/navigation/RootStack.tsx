import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EventDetailScreen } from "../modules/event/EventDetailScreen";
import { IncidentDetailScreen } from "../modules/incident/IncidentDetailScreen";
import { MyReportsScreen } from "../modules/incident/MyReportsScreen";
import { InviteAcceptScreen } from "../modules/invite/InviteAcceptScreen";
import { JoinRequestScreen } from "../modules/organisation/JoinRequestScreen";
import { OrganisationDirectoryScreen } from "../modules/organisation/OrganisationDirectoryScreen";
import { ReportWizardScreen } from "../modules/incident/ReportWizard/ReportWizardScreen";
import { TaskDetailScreen } from "../modules/task/TaskDetailScreen";
import { TaskEvidenceScreen } from "../modules/task/TaskEvidenceScreen";
import { MainTabs } from "./MainTabs";

/**
 * Detail screens live here, above the tab navigator, rather than nested
 * inside each tab's own stack — a push notification or deep link can then
 * target any of them (`navigate("IncidentDetail", {...})`) regardless of
 * which tab is currently active, without knowing or caring which tab "owns"
 * that screen.
 */
const Stack = createNativeStackNavigator();

export function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ReportModal"
        component={ReportWizardScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="InviteAccept"
        component={InviteAcceptScreen}
        options={{ title: "Join organization" }}
      />
      <Stack.Screen
        name="IncidentDetail"
        component={IncidentDetailScreen}
        options={{ title: "Report" }}
      />
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ title: "My Reports" }}
      />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: "Task" }} />
      <Stack.Screen
        name="TaskEvidence"
        component={TaskEvidenceScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Event" }} />
      <Stack.Screen
        name="OrganisationDirectory"
        component={OrganisationDirectoryScreen}
        options={{ title: "Find an Organization" }}
      />
      <Stack.Screen name="JoinRequest" component={JoinRequestScreen} options={{ title: "Join Request" }} />
    </Stack.Navigator>
  );
}
