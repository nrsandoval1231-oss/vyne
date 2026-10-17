import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import Animated, {
  FadeIn,
  LinearTransition,
  ReduceMotion,
  useReducedMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { colors as c } from "../../../../packages/design-tokens/src";
import type { DemoPhoto } from "../../../../packages/domain/src";
import { images } from "../data/images";
import { useLibrary } from "../state/LibraryProvider";
export { c };
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}
export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.title}>
      {children}
    </Text>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 14, marginTop: 12 }}>
      <Text accessibilityRole="header" style={s.section}>
        {title}
      </Text>
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Motion({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
      layout={LinearTransition.duration(220).reduceMotion(ReduceMotion.System)}
      style={{ gap: 18 }}
    >
      {children}
    </Animated.View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: c.mist }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected = false,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={onPress}
      style={[s.chip, selected && { backgroundColor: c.seaGlass }]}
    >
      <Text
        style={{
          color: selected ? c.ink : c.mist,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.iconButton}
    >
      <Feather name={name} size={21} color={c.mist} />
    </Pressable>
  );
}
export function Brand() {
  return (
    <View style={s.row}>
      <Svg
        width={32}
        height={34}
        viewBox="0 0 40 40"
        accessibilityLabel="VYNE provisional ribbon mark"
      >
        <Path
          d="M5 7 C13 7 12 31 21 33 C27 27 28 10 35 7 M14 9 C18 12 18 20 22 23"
          fill="none"
          stroke={c.seaGlass}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          color: c.mist,
          fontSize: 22,
          fontWeight: "600",
          letterSpacing: 5,
        }}
      >
        VYNE
      </Text>
    </View>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = false,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
}) {
  const { error, busy } = useLibrary();
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={s.screen}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {back && (
          <View style={s.row}>
            <IconButton
              name="arrow-left"
              label="Go back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
            />
            <Label>VYNE / DEMONSTRATION</Label>
          </View>
        )}
        {title && (
          <View style={{ gap: 8 }}>
            <Title>{title}</Title>
            {subtitle && <Body>{subtitle}</Body>}
          </View>
        )}
        {error && (
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
        )}
        {busy && (
          <Text accessibilityLiveRegion="polite" style={s.label}>
            Saving locally…
          </Text>
        )}
        {children}
        <Text style={s.footer}>DEMO LIBRARY · ON YOUR DEVICE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Photo({
  photo,
  height = 210,
  onPress,
  badge,
}: {
  photo: DemoPhoto;
  height?: number;
  onPress?: () => void;
  badge?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open photo: ${photo.title}`}
      onPress={onPress ?? (() => router.push(`/photo/${photo.id}`))}
      style={({ pressed }) => ({
        borderRadius: 20,
        overflow: "hidden",
        height,
        opacity: pressed ? 0.85 : 1,
        backgroundColor: c.deepTeal,
      })}
    >
      <Image
        source={images[photo.assetKey]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={reducedMotion ? 0 : 180}
        accessibilityLabel={photo.title}
      />
      {badge && (
        <View style={s.photoBadge}>
          <Text style={{ color: c.mist, fontSize: 12, fontWeight: "600" }}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
export function Progress({ value }: { value: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.min(100, Math.max(0, value * 100))}%`, {
      duration: 260,
      reduceMotion: ReduceMotion.System,
    }),
  }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={s.track}
    >
      <Animated.View
        style={[
          { height: 4, borderRadius: 5, backgroundColor: c.seaGlass },
          animatedStyle,
        ]}
      />
    </View>
  );
}
export function RowLink({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.rowLink}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.section}>{title}</Text>
        {detail && <Body>{detail}</Body>}
      </View>
      <Feather name="chevron-right" color={c.muted} size={20} />
    </Pressable>
  );
}
export const formatBytes = (bytes: number) =>
  `${(bytes / 1000000).toFixed(1)} MB`;
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.midnight },
  screen: { padding: 24, paddingBottom: 36, gap: 24 },
  title: {
    color: c.mist,
    fontSize: 36,
    fontWeight: "500",
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  section: {
    color: c.mist,
    fontSize: 19,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
  body: { color: c.muted, fontSize: 15, lineHeight: 23 },
  label: {
    color: c.seaGlass,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#103D3B80",
    borderWidth: 1,
    borderColor: "#91B3AF18",
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: c.seaGlass,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondary: {
    backgroundColor: c.deepTeal,
    borderWidth: 1,
    borderColor: "#91B3AF35",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: c.ink,
    textAlign: "center",
  },
  iconButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#103D3B80",
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: c.deepTeal,
    borderRadius: 24,
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    alignSelf: "flex-start",
    backgroundColor: "#031111C0",
    borderRadius: 9,
    padding: 9,
  },
  track: {
    height: 4,
    backgroundColor: "#91B3AF30",
    borderRadius: 5,
    overflow: "hidden",
  },
  footer: {
    color: c.muted,
    fontSize: 10,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 10,
  },
  rowLink: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  input: {
    minHeight: 52,
    padding: 15,
    color: c.mist,
    borderWidth: 1,
    borderColor: c.muted,
    borderRadius: 14,
    fontSize: 16,
  },
});
