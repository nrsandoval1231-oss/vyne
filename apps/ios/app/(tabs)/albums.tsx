import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Label,
  Body,
  Button,
  Card,
  Photo,
  Chip,
  s,
  c,
} from "../../src/components/ui";
import { photos } from "../../src/data/demo";
import { useLibrary } from "../../src/state/LibraryProvider";
export default function Albums() {
  const { state, update, busy } = useLibrary();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("All");
  const filters: Record<string, string[]> = {
    All: [],
    People: ["family"],
    Places: ["trips", "places"],
    Things: ["sports", "work", "pets", "screenshots"],
    Events: ["events"],
    Yours: state.albums.filter((a) => a.custom).map((a) => a.id),
  };
  const visible = state.albums.filter(
    (a) => filter === "All" || filters[filter].includes(a.id),
  );
  return (
    <Screen
      title="Your life, collected."
      subtitle="Every photo can belong to more than one story."
    >
      <Label>Demo smart albums · app collections</Label>
      <View style={s.grid}>
        {Object.keys(filters).map((f) => (
          <Chip
            key={f}
            title={f}
            selected={f === filter}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>
      <View style={s.grid}>
        {visible.map((album) => {
          const members = photos.filter((p) =>
            state.memberships[p.id]?.includes(album.id),
          );
          return (
            <View key={album.id} style={{ width: "48%", gap: 8 }}>
              {members[0] ? (
                <Photo
                  photo={members[0]}
                  height={190}
                  onPress={() => router.push(`/album/${album.id}`)}
                />
              ) : (
                <Card style={{ height: 190, justifyContent: "center" }}>
                  <Button
                    secondary
                    title="Open collection"
                    onPress={() => router.push(`/album/${album.id}`)}
                  />
                </Card>
              )}
              <Text style={s.section}>{album.name}</Text>
              <Body>{members.length} photos</Body>
            </View>
          );
        })}
      </View>
      {visible.length === 0 && (
        <Body>Your personal collections will appear here.</Body>
      )}
      {creating ? (
        <Card>
          <Label>A collection of your own</Label>
          <TextInput
            accessibilityLabel="Album name"
            placeholder="e.g. Little adventures"
            placeholderTextColor={c.muted}
            value={name}
            onChangeText={setName}
            maxLength={60}
            style={s.input}
          />
          <Button
            title="Create album"
            disabled={
              busy ||
              !name.trim() ||
              state.albums.some(
                (a) => a.name.toLowerCase() === name.trim().toLowerCase(),
              )
            }
            onPress={() => {
              const title = name.trim();
              void update((current) => ({
                ...current,
                albums: [
                  ...current.albums,
                  { id: `custom-${Date.now()}`, name: title, custom: true },
                ],
              }));
              setName("");
              setCreating(false);
              setFilter("Yours");
            }}
          />
          <Button secondary title="Cancel" onPress={() => setCreating(false)} />
        </Card>
      ) : (
        <Button
          secondary
          title="Create a collection"
          onPress={() => setCreating(true)}
        />
      )}
      <Body>
        Classifications are simulated. Correct an assignment from any photo.
        Apple Photos album sync is planned for a future native milestone.
      </Body>
    </Screen>
  );
}
