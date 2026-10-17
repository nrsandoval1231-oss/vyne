import { useLocalSearchParams, router } from "expo-router";
import { View } from "react-native";
import {
  Screen,
  Photo,
  Card,
  Label,
  Body,
  Chip,
  Button,
  Section,
  formatBytes,
  s,
} from "../../src/components/ui";
import { photos, groups } from "../../src/data/demo";
import { useLibrary } from "../../src/state/LibraryProvider";
import { setMembership } from "../../../../packages/intelligence/src";
export default function PhotoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, busy } = useLibrary();
  const photo = photos.find((p) => p.id === id);
  if (!photo)
    return (
      <Screen back title="Photo unavailable">
        <Body>This sample photo could not be found.</Body>
      </Screen>
    );
  const recommendations = groups.filter((g) => g.assetIds.includes(id));
  return (
    <Screen back title={photo.title}>
      <Photo
        photo={photo}
        height={420}
        onPress={() => router.push(`/viewer/${id}`)}
        badge="Tap to view full screen"
      />
      <Card>
        <Label>Sample metadata</Label>
        <Body>
          {photo.capturedAt?.slice(0, 10)} · {photo.location}
        </Body>
        <Body>
          {photo.width} × {photo.height} · estimated original{" "}
          {formatBytes(photo.bytes)}
        </Body>
        <Body>
          Metadata describes a fictional library record, not the bundled preview
          file.
        </Body>
      </Card>
      <Section title="Part of your story">
        <Body>Tap a collection to correct its assignment.</Body>
        <View style={s.grid}>
          {state.albums.map((a) => (
            <Chip
              key={a.id}
              title={a.name}
              selected={state.memberships[id]?.includes(a.id)}
              onPress={
                busy
                  ? undefined
                  : () =>
                      void update((current) =>
                        setMembership(
                          current,
                          id,
                          a.id,
                          !current.memberships[id]?.includes(a.id),
                          new Date().toISOString(),
                        ),
                      )
              }
            />
          ))}
        </View>
      </Section>
      <Card>
        <Label>
          {photo.protected ? "Memory protection" : "Simulated classification"}
        </Label>
        <Body>
          {photo.protectionReason ??
            "These sample categories were assigned by hand. No AI model has analyzed this photo."}
        </Body>
        <Body>
          {photo.protected
            ? "Potential sentiment is a protective assumption, not a claim about what this photo means to you."
            : "Keep or correct a classification to provide local feedback."}
        </Body>
      </Card>
      {recommendations.map((g) => (
        <Card key={g.id}>
          <Label>{g.kind} · sample suggestion</Label>
          <Body>{g.reason}</Body>
        </Card>
      ))}
      {recommendations.length > 0 && (
        <Button
          title="Open cleanup review"
          onPress={() => router.push("/cleanup")}
        />
      )}
    </Screen>
  );
}
