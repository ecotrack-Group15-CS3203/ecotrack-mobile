import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { ReportPlaceholderScreen } from "./placeholders/ReportPlaceholderScreen";

const RootStack = createNativeStackNavigator();

// Hardcoded until authStore exists (Phase 1 auth module) — this just proves
// the AuthStack/MainTabs switch works before real auth state is wired in.
const isAuthenticated = false;

export function NavigationShell() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <RootStack.Navigator>
            <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <RootStack.Screen
              name="ReportModal"
              component={ReportPlaceholderScreen}
              options={{ presentation: "modal", title: "Report Incident" }}
            />
          </RootStack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
