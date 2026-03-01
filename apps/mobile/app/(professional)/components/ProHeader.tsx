import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: Href; // route
};

export function ProHeader({ title, subtitle, backTo }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => (backTo ? router.push(backTo) : router.back())}
        style={styles.backBtn}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </Pressable>

      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#6B2737",
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 6,
  },
});