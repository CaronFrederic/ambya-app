import { View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../../src/services/api";

export default function Appointments() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    retry: 1,
  });

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Text style={{ fontSize: 18 }}>Mes rendez-vous</Text>

      {isLoading && <ActivityIndicator />}

      {!isLoading && !error && (
        <Text>API: ✅ {data?.status} ({data?.service})</Text>
      )}

      {!isLoading && error && (
        <Text>API: ❌ KO ({String(error)})</Text>
      )}

      <Text onPress={() => refetch()} style={{ marginTop: 12, textDecorationLine: "underline" }}>
        Re-tester
      </Text>
    </View>
  );
}
