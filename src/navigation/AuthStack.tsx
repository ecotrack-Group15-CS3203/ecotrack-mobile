import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "./placeholders/LoginScreen";

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
