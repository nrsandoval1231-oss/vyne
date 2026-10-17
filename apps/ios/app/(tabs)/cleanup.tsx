import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  Screen,
  Label,
  Body,
  Card,
  Button,
  Chip,
  Photo,
  Progress,
  Motion,
  s,
} from "../../src/components/ui";
import { photos, groups } from "../../src/data/demo";
import { useLibrary } from "../../src/state/LibraryProvider";
import {
  applyDecision,
  eligibleIds,
  latestDecisions,
  personalExplanation,
} from "../../../../packages/intelligence/src";
import type {
  CleanupKind,
  DemoReviewAction,
} from "../../../../packages/domain/src";
export default function Cleanup() {
  const { state, update, busy } = useLibrary();
  const [filter, setFilter] = useState<CleanupKind | "all">("all");
  const [groupId, setGroupId] = useState(groups[0].id);
  const [expanded, setExpanded] = useState(false);
  const [about, setAbout] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const latest = latestDecisions(state.decisions);
  const visible = groups.filter((g) => filter === "all" || g.kind === filter);
  const group = visible.find((g) => g.id === groupId) ?? visible[0];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = photos.find(
    (p) =>
      p.id ===
      (selectedId && group.assetIds.includes(selectedId)
        ? selectedId
        : (group.candidateIds[0] ?? group.assetIds[0])),
  )!;
  const keeper = photos.find((p) => p.id === group.suggestedKeeperId);
  const previous = latest.get(group.id);
  const personal = personalExplanation(state, photos, group);
  function choose(id: string) {
    setGroupId(id);
    setSelectedId(null);
    setExpanded(false);
    setConfirming(false);
  }
  async function decide(action: DemoReviewAction) {
    await update((current) =>
      applyDecision(current, group, photos, action, new Date().toISOString()),
    );
    setConfirming(false);
  }
  return (
    <Screen
      title="A lighter library."
      subtitle="You choose what stays. Always."
    >
      <Label>Demo review · no photos will be deleted</Label>
      <View style={{ gap: 9 }}>
        <Body>
          {latest.size} of {groups.length} groups reviewed
        </Body>
        <Progress value={latest.size / groups.length} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {(
          ["all", "duplicates", "similar", "blurry", "screenshots"] as const
        ).map((kind) => (
          <Chip
            key={kind}
            title={kind[0].toUpperCase() + kind.slice(1)}
            selected={filter === kind}
            onPress={() => {
              setFilter(kind);
              setConfirming(false);
              setSelectedId(null);
            }}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {visible.map((g, i) => (
          <Chip
            key={g.id}
            title={`${i + 1}. ${latest.has(g.id) ? "Reviewed" : "To review"}`}
            selected={g.id === group.id}
            onPress={() => choose(g.id)}
          />
        ))}
      </ScrollView>
      <Motion key={group.id}>
        <Text accessibilityRole="header" style={s.section}>
          {group.title}
        </Text>
        <View style={s.grid}>
          {keeper && keeper.id !== selected.id && (
            <View style={{ flex: 1 }}>
              <Photo photo={keeper} height={250} badge="Suggested keeper" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Photo
              photo={selected}
              height={250}
              badge={
                selected.protected
                  ? "Memory protected"
                  : selected.id === keeper?.id
                    ? "Suggested keeper"
                    : "Selected for comparison"
              }
            />
          </View>
        </View>
        <Body>{selected.title} · tap a photo for details</Body>
        <View style={s.grid}>
          {group.assetIds.map((id) => {
            const p = photos.find((p) => p.id === id)!;
            return (
              <View
                key={id}
                style={{
                  width: 56,
                  borderWidth: 2,
                  borderColor: selected.id === id ? "#42D6C5" : "transparent",
                  borderRadius: 14,
                }}
              >
                <Photo
                  photo={p}
                  height={64}
                  onPress={() => setSelectedId(id)}
                />
              </View>
            );
          })}
        </View>
        <Card>
          <Label>Simulated recommendation</Label>
          <Body>{group.reason}</Body>
          {personal && <Body>{personal}</Body>}
          <Button
            secondary
            title={expanded ? "Hide explanation" : "Why this suggestion?"}
            onPress={() => setExpanded(!expanded)}
          />
          {expanded && (
            <Body>
              M1 uses hand-authored sample groups, not AI inference. Keep
              protects these photos in overlapping cleanup groups. Skip records
              uncertainty. Review for Deletion records a local intention only.
              Recommended keepers and protected memories are excluded.
            </Body>
          )}
        </Card>
        {previous && (
          <Card>
            <Label>Saved on this device</Label>
            <Body>
              {previous.action === "review_for_deletion"
                ? "Queued for a future deletion review"
                : previous.action === "keep"
                  ? "Kept"
                  : "Skipped"}{" "}
              · you can change your decision below.
            </Body>
          </Card>
        )}
        {confirming ? (
          <Card>
            <Label>Confirm demo review</Label>
            <Body>
              Set aside {eligibleIds(group, photos, state).length} sample photos
              for deletion review? This records your preference locally. No
              Apple Photos access or deletion occurs.
            </Body>
            <Button title="Go back" onPress={() => setConfirming(false)} />
            <Button
              secondary
              title="Confirm review intention"
              disabled={busy}
              onPress={() => void decide("review_for_deletion")}
            />
          </Card>
        ) : (
          <>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Keep"
                  disabled={busy}
                  onPress={() => void decide("keep")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  secondary
                  title="Skip"
                  disabled={busy}
                  onPress={() => void decide("skip")}
                />
              </View>
            </View>
            {eligibleIds(group, photos, state).length > 0 ? (
              <Button
                secondary
                title="Review for Deletion"
                disabled={busy}
                onPress={() => setConfirming(true)}
              />
            ) : (
              <Body>
                This memory is protected or kept in another group. There are no
                deletion candidates.
              </Body>
            )}
          </>
        )}
        {previous && (
          <Button
            secondary
            title="Next group"
            onPress={() => {
              const index = visible.findIndex((g) => g.id === group.id);
              choose(visible[(index + 1) % visible.length].id);
            }}
          />
        )}
        <Button
          secondary
          title="About this demo"
          onPress={() => setAbout(!about)}
        />
        {about && (
          <Body>
            All photos are bundled samples. Review actions are saved in local
            SQLite. Native PhotoKit integration is planned for M2. Your library
            is untouched.
          </Body>
        )}
      </Motion>
    </Screen>
  );
}
