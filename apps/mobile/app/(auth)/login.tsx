import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { login } from "../../src/api/auth";

import { colors } from "../../src/theme/colors";
import { overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMeLoyalty, fetchMeSummary } from "../../src/api/me";
import { useAuthRefresh } from "../../src/providers/AuthRefreshProvider";

const logo = require("../../assets/splash-logo.png");

export default function Login() {
  const { refreshAuth } = useAuthRefresh();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [userType, setUserType] = useState<"client" | "professional">("client");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const qc = useQueryClient();

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Connexion", "Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await login({
        email: email.trim(),
        password,
      });

      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("userRole", data.user.role);

      try {
        const summary = await fetchMeSummary();
        qc.setQueryData(["me", "summary"], summary);
      } catch {}

      try {
        const loyalty = await fetchMeLoyalty();
        qc.setQueryData(["me", "loyalty"], loyalty);
      } catch {}

      await refreshAuth();

      if (data.user.role === "PROFESSIONAL") {
        router.replace("/(professional)/dashboard");
      } else if (data.user.role === "EMPLOYEE") {
        router.replace("/(employee)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Connexion impossible",
        "Email ou mot de passe incorrect, ou serveur indisponible."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSignupPress = () => {
    if (userType === "client") {
      router.push("/(auth)/client-signup");
      return;
    }

    // router.push('/(auth)/pro-signup')
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {userType === "professional" ? "AMBYA Pro" : "Bienvenue sur AMBYA"}
        </Text>

        <Text style={styles.subtitle}>
          {userType === "professional"
            ? "Espace Professionnel"
            : "L'élégance à portée de main"}
        </Text>

        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setUserType("client")}
            style={[
              styles.toggleBtn,
              userType === "client" && styles.toggleActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                userType === "client" && styles.toggleTextActive,
              ]}
            >
              Client
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setUserType("professional")}
            style={[
              styles.toggleBtn,
              userType === "professional" && styles.toggleActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                userType === "professional" && styles.toggleTextActive,
              ]}
            >
              Professionnel
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab("login")}
            style={[styles.tab, activeTab === "login" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "login" && styles.tabTextActive,
              ]}
            >
              Connexion
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("signup")}
            style={[styles.tab, activeTab === "signup" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "signup" && styles.tabTextActive,
              ]}
            >
              Inscription
            </Text>
          </Pressable>
        </View>

        <Card style={styles.card}>
          {activeTab === "login" ? (
            <View style={{ gap: spacing.md }}>
              <Input
                placeholder={
                  userType === "professional"
                    ? "Email professionnel"
                    : "Email ou téléphone"
                }
                value={email}
                onChangeText={setEmail}
              />

              <Input
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Button
                title={submitting ? "Connexion..." : "Se connecter"}
                onPress={onSubmit}
              />
            </View>
          ) : (
            <View style={styles.signupWrap}>
              <View style={styles.logoBox}>
                <Image source={logo} resizeMode="contain" style={styles.logo} />
              </View>

              <Button
                title={
                  userType === "professional"
                    ? "Inscription Professionnelle"
                    : "Créer un compte"
                }
                onPress={onSignupPress}
              />
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },

  title: {
    color: colors.brandForeground,
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },

  subtitle: {
    color: colors.premium,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  toggleWrap: {
    marginTop: spacing.lg,
    backgroundColor: overlays.white10,
    borderRadius: 999,
    padding: 4,
    flexDirection: "row",
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    alignItems: "center",
  },

  toggleActive: {
    backgroundColor: colors.premium,
  },

  toggleText: {
    color: colors.brandForeground,
    fontWeight: "500",
  },

  toggleTextActive: {
    color: colors.brand,
  },

  body: {
    flex: 1,
    padding: spacing.lg,
  },

  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  tab: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: overlays.brand20,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },

  tabText: {
    color: colors.text,
    fontWeight: "500",
  },

  tabTextActive: {
    color: colors.brandForeground,
  },

  card: {
    padding: spacing.lg,
  },

  signupWrap: {
    gap: spacing.lg,
    alignItems: "center",
  },

  logoBox: {
    backgroundColor: colors.brand,
    padding: spacing.md,
    borderRadius: radius.lg,
  },

  logo: {
    width: 120,
    height: 120,
  },
});