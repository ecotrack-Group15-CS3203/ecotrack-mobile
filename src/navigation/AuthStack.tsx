import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../modules/auth/LoginScreen";

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
