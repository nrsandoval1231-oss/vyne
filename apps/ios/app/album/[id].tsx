import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useState } from "react";
import {
  Screen,
  Body,
  Button,
  Photo,
  Chip,
  Card,
  s,
} from "../../src/components/ui";
import { photos } from "../../src/data/demo";
import { useLibrary } from "../../src/state/LibraryProvider";
import { setMembership } from "../../../../packages/intelligence/src";
export default function AlbumDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, busy } = useLibrary();
  const [editing, setEditing] = useState(false);
  const album = state.albums.find((a) => a.id === id);
  const members = photos.filter((p) => state.memberships[p.id]?.includes(id));
  if (!album)
    return (
      <Screen back title="Album unavailable">
        <Body>This collection no longer exists.</Body>
      </Screen>
    );
  return (
    <Screen
      back
      title={album.name}
      subtitle={`${members.length} photos · one original, many stories`}
    >
      <Body>Demonstration collection. Changes stay inside VYNE.</Body>
      <Button
        secondary
        title={editing ? "Done editing" : "Add or correct photos"}
        onPress={() => setEditing(!editing)}
      />
      <View style={s.grid}>
        {(editing ? photos : members).map((p) => (
          <View key={p.id} style={{ width: "48%", gap: 8 }}>
            <Photo photo={p} height={180} />
            {editing && (
              <Chip
                title={
                  state.memberships[p.id]?.includes(id)
                    ? "✓ Assigned"
                    : "Add to album"
                }
                selected={state.memberships[p.id]?.includes(id)}
                onPress={
                  busy
                    ? undefined
                    : () =>
                        void update((current) =>
                          setMembership(
                            current,
                            p.id,
                            id,
                            !current.memberships[p.id]?.includes(id),
                            new Date().toISOString(),
                          ),
                        )
                }
              />
            )}
          </View>
        ))}
      </View>
      {!editing && !members.length && (
        <Card>
          <Body>
            A little room for a new story. Add photos to start this collection.
          </Body>
        </Card>
      )}
    </Screen>
  );
}
