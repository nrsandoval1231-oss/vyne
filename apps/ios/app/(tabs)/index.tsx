import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  Brand,
  IconButton,
  Screen,
  Title,
  Body,
  Label,
  Card,
  Button,
  Section,
  Photo,
  Progress,
  RowLink,
  formatBytes,
  s,
  c,
} from "../../src/components/ui";
import { photos, groups } from "../../src/data/demo";
import { useLibrary } from "../../src/state/LibraryProvider";
import { storageSummary } from "../../../../packages/intelligence/src";
export default function Home() {
  const { state } = useLibrary();
  const stats = storageSummary(photos, groups, state);
  return (
    <Screen>
      <View style={s.spread}>
        <Brand />
        <IconButton
          name="settings"
          label="Settings and privacy"
          onPress={() => router.push("/settings")}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Label>Your life in focus.</Label>
        <Title>More memories.{"\n"}Less noise.</Title>
        <Body>A little space for what matters.</Body>
      </View>
      <Photo photo={photos[0]} height={255} badge="A life worth keeping" />
      <View style={{ gap: 10 }}>
        <View style={s.spread}>
          <Label>Demonstration library</Label>
          <Text style={s.body}>{photos.length} sample photos</Text>
        </View>
        <Progress value={1} />
        <Body>Demo analysis complete · simulated recommendations</Body>
      </View>
      <Card>
        <Label>Room for something new</Label>
        <Text
          style={{
            color: c.mist,
            fontSize: 48,
            fontWeight: "400",
            letterSpacing: -2,
          }}
        >
          {formatBytes(stats.potentialBytes)}
        </Text>
        <Body>
          Potential recovery in the sample library. Nothing is deleted.
        </Body>
        <Button
          title="Review cleanup"
          onPress={() => router.push("/cleanup")}
        />
        <RowLink
          title="Storage insights"
          detail={`${stats.reviewed} of ${stats.total} groups reviewed`}
          onPress={() => router.push("/storage")}
        />
      </Card>
      <View style={s.grid}>
        {(["duplicates", "screenshots", "blurry"] as const).map((kind) => (
          <View key={kind} style={{ flex: 1, minWidth: 85, gap: 6 }}>
            <Text style={{ color: c.mist, fontSize: 27 }}>
              {groups.filter((g) => g.kind === kind).length}
            </Text>
            <Text style={s.body}>
              {kind === "blurry"
                ? "Blur review"
                : kind === "duplicates"
                  ? "Duplicates"
                  : "Screenshots"}
            </Text>
          </View>
        ))}
      </View>
      <Section title="Life, beautifully organized">
        <View style={s.grid}>
          {["family", "trips"].map((id) => {
            const album = state.albums.find((a) => a.id === id)!;
            const members = photos.filter((p) =>
              state.memberships[p.id]?.includes(id),
            );
            return (
              <View key={id} style={{ flex: 1, gap: 9 }}>
                {members[0] ? (
                  <Photo
                    photo={members[0]}
                    height={168}
                    onPress={() => router.push(`/album/${id}`)}
                  />
                ) : (
                  <Button
                    title="Open album"
                    secondary
                    onPress={() => router.push(`/album/${id}`)}
                  />
                )}
                <Text style={s.section}>{album.name}</Text>
                <Body>{members.length} photos</Body>
              </View>
            );
          })}
        </View>
        <Button
          secondary
          title="Explore smart albums"
          onPress={() => router.push("/albums")}
        />
      </Section>
      <Section title="Recently organized">
        {state.organizationPreview ? (
          <View style={s.grid}>
            {[photos[2], photos[9], photos[10]].map((p) => (
              <View key={p.id} style={{ flex: 1 }}>
                <Photo photo={p} height={115} />
              </View>
            ))}
          </View>
        ) : (
          <Body>Organization previews are paused in Settings.</Body>
        )}
        <Body>
          Sample assignments, stored as references. Originals are never
          duplicated.
        </Body>
      </Section>
      <Card>
        <Label>Made personal</Label>
        <RowLink
          title="VYNE learns what matters"
          detail="See your local preference signals"
          onPress={() => router.push("/learning")}
        />
      </Card>
    </Screen>
  );
}
