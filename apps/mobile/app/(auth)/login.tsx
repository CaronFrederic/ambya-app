import { Text } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/Button";

export default function Login() {
  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>Login</Text>

      <Button title="Entrer (Client)" onPress={() => router.replace("/(tabs)/home")} />
      <Button title="Entrer (Professional)" onPress={() => router.replace("/(professional)/dashboard")} variant="secondary" />
      <Button title="Entrer (Employee)" onPress={() => router.replace("/(employee)/dashboard")} variant="secondary" />
    </Screen>
  );
}
