import { Redirect } from "expo-router";

const role: "client" | "professional" | "employee" = "client";

export default function Index() {
  if (role === "professional") return <Redirect href="/(professional)/dashboard" />;
  if (role === "employee") return <Redirect href="/(employee)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}
