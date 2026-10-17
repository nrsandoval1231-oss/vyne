import { Text } from "react-native";
import {
  Screen,
  Card,
  Label,
  Body,
  Section,
  Progress,
  formatBytes,
  s,
  c,
} from "../src/components/ui";
import { photos, groups } from "../src/data/demo";
import { useLibrary } from "../src/state/LibraryProvider";
import { storageSummary } from "../../../packages/intelligence/src";
export default function Storage() {
  const { state } = useLibrary();
  const stats = storageSummary(photos, groups, state);
  return (
    <Screen
      back
      title="Space for more."
      subtitle="A clearer view of your sample library."
    >
      <Card>
        <Label>Estimated reclaimable · demo</Label>
        <Text style={{ fontSize: 48, color: c.mist, letterSpacing: -2 }}>
          {formatBytes(stats.potentialBytes)}
        </Text>
        <Body>
          {formatBytes(stats.queuedBytes)} set aside across {stats.queuedCount}{" "}
          unique photos.
        </Body>
        <Body>Actual space recovered: 0 MB. M1 does not delete photos.</Body>
      </Card>
      <Section title="Where the space is">
        {(["duplicates", "screenshots", "similar", "blurry"] as const).map(
          (kind) => {
            const subtotal = storageSummary(
              photos,
              groups.filter((g) => g.kind === kind),
              state,
            );
            return (
              <Card key={kind}>
                <Label>{kind}</Label>
                <Text style={s.section}>
                  {formatBytes(subtotal.potentialBytes)}
                </Text>
                <Body>
                  {groups.filter((g) => g.kind === kind).length} sample groups
                </Body>
              </Card>
            );
          },
        )}
        <Body>
          Categories can overlap; do not add these subtotals. The total above
          deduplicates asset IDs and excludes protected photos, recommended
          keepers within each group, and photos you kept.
        </Body>
      </Section>
      <Section title="Your review progress">
        <Progress value={stats.reviewed / stats.total} />
        <Body>
          {stats.reviewed} of {stats.total} groups reviewed
        </Body>
      </Section>
      <Section title="Review history">
        {state.decisions.length === 0 && (
          <Body>Your next decision will appear here.</Body>
        )}
        {state.decisions
          .slice()
          .reverse()
          .map((d) => (
            <Card key={d.id}>
              <Label>
                {d.action === "review_for_deletion"
                  ? "Set aside for review"
                  : d.action}
              </Label>
              <Body>{groups.find((g) => g.id === d.groupId)?.title}</Body>
              <Body>
                {d.assetIds.length} photos ·{" "}
                {new Date(d.timestamp).toLocaleString()}
              </Body>
            </Card>
          ))}
      </Section>
      <Body>
        Future authorized deletions will follow Apple Photos confirmation. Space
        may remain occupied in Recently Deleted until those assets are
        permanently removed through Apple Photos.
      </Body>
    </Screen>
  );
}
