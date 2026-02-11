import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Login() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Login</Text>

      <Pressable onPress={() => router.replace("/(tabs)/appointments")}>
        <Text style={{ marginTop: 16 }}>Aller aux RDV</Text>
      </Pressable>
    </View>
  );
}
