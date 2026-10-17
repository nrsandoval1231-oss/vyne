import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { c } from "../../src/components/ui";
export default function TabsLayout() {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reduced ? "none" : "fade",
        tabBarActiveTintColor: c.seaGlass,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.midnight,
          height: 80 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(12, insets.bottom),
          borderTopColor: "#91B3AF25",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          flexShrink: 0,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="home"
              color={typeof color === "string" ? color : c.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cleanup"
        options={{
          title: "Cleanup",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="layers"
              color={typeof color === "string" ? color : c.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="albums"
        options={{
          title: "Albums",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="grid"
              color={typeof color === "string" ? color : c.muted}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
