import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../../packages/design-tokens/src";
import type { SnapshotError } from "../services/persistence";

// Independent of LibraryProvider's context: this screen must work before a library exists.
export function LibraryRecovery({
  issue,
  pending,
  error,
  onRetry,
  onRecover,
}: {
  issue: SnapshotError | null;
  pending: boolean;
  error: string | null;
  onRetry: () => void;
  onRecover: (mode: "salvage" | "fresh") => void;
}) {
  const [confirmation, setConfirmation] = useState<"salvage" | "fresh" | null>(
    null,
  );
  const recovered = issue?.recoverable;
  const action = (title: string, onPress: () => void, primary = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: pending }}
      disabled={pending}
      onPress={onPress}
      style={[
        styles.button,
        primary && { backgroundColor: colors.seaGlass },
        pending && { opacity: 0.5 },
      ]}
    >
      <Text
        style={{
          color: primary ? colors.ink : colors.mist,
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>VYNE · LOCAL DATA RECOVERY</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Let’s reopen your library.
        </Text>
        <Text style={styles.body}>
          {issue?.kind === "unsupported"
            ? "This saved library uses a schema this version of VYNE cannot read. Updating to a compatible app version may restore it."
            : issue
              ? "Some saved demonstration data could not be read. Your original snapshot has not been changed."
              : "Local storage could not be opened. Try again; your saved data has not been reset."}
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={styles.body}>
            {error}
          </Text>
        )}
        {pending && (
          <View accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.seaGlass} />
            <Text style={styles.body}>Working on local data…</Text>
          </View>
        )}
        {recovered && (
          <View style={styles.card}>
            <Text style={styles.label}>Readable data found</Text>
            <Text style={styles.body}>
              {recovered.decisions.length} review records,{" "}
              {recovered.albums.filter((album) => album.custom).length} custom
              albums,{" "}
              {Object.values(recovered.memberships).reduce(
                (sum, ids) => sum + ids.length,
                0,
              )}{" "}
              album assignments and {recovered.corrections.length} corrections
              can be retained. Valid settings and preference controls are also
              retained.
            </Text>
            <Text style={styles.body}>
              {issue.repairs} damaged or missing entries need repair. Unreadable
              records will be omitted; missing assignments become unassigned.
              Core demo albums are restored where needed.
            </Text>
          </View>
        )}
        {issue && (
          <Text style={styles.body}>
            Before recovery, VYNE will keep an exact copy of the unreadable
            snapshot on this device for later recovery with compatible tools.
            Nothing is uploaded. A failed save leaves the original intact. Apple
            Photos is unaffected.
          </Text>
        )}
        {confirmation ? (
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.label}>
              Confirm local recovery
            </Text>
            <Text style={styles.body}>
              {confirmation === "salvage"
                ? "Keep readable entries and repair the active library? Data that cannot be safely interpreted will remain only in the archived snapshot."
                : "Start a fresh demonstration library? Existing reviews, custom albums and preferences will remain only in the archived snapshot."}
            </Text>
            {action("Cancel", () => setConfirmation(null), true)}
            {action(
              confirmation === "salvage"
                ? "Confirm recovery"
                : "Confirm fresh library",
              () => onRecover(confirmation),
            )}
          </View>
        ) : (
          <>
            {action("Try again", onRetry, true)}
            {recovered &&
              action("Recover readable data", () => setConfirmation("salvage"))}
            {issue &&
              action("Start fresh demo library", () =>
                setConfirmation("fresh"),
              )}
          </>
        )}
        {issue && (
          <Text style={styles.body}>
            Recovery archives stay local until you use Settings → Reset
            demonstration data, which also removes those archives. This app does
            not yet offer an archive import or export tool.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  content: { padding: 28, gap: 22, flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 32, lineHeight: 38, color: colors.mist },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.3,
    color: colors.seaGlass,
  },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
  card: {
    padding: 20,
    gap: 16,
    borderRadius: 20,
    backgroundColor: colors.deepTeal,
  },
  button: {
    minHeight: 52,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.deepTeal,
    justifyContent: "center",
  },
});
