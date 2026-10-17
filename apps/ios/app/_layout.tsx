import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useReducedMotion } from "react-native-reanimated";
import { LibraryProvider } from "../src/state/LibraryProvider";
import { c } from "../src/components/ui";
export default function RootLayout() {
  const reduced = useReducedMotion();
  return (
    <LibraryProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.midnight },
          animation: reduced ? "none" : "slide_from_right",
        }}
      />
    </LibraryProvider>
  );
}
