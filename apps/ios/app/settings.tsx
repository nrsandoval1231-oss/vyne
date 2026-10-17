import { useState } from "react";
import { Switch, View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Card,
  Label,
  Body,
  Button,
  RowLink,
  Section,
  s,
  c,
} from "../src/components/ui";
import { useLibrary } from "../src/state/LibraryProvider";
import { initialState } from "../src/data/demo";
import { nativeIntegration } from "../../../modules/photo-intelligence/src";
export default function Settings() {
  const { state, update, busy } = useLibrary();
  const [confirming, setConfirming] = useState(false);
  return (
    <Screen
      back
      title="Private by nature."
      subtitle="Your photos. Your choices. Your device."
    >
      <Card>
        <Label>Photo library permissions</Label>
        <Body>{nativeIntegration.reason}</Body>
        <Body>
          No photo-library permission is requested in M1. Your Apple Photos
          library is never read or changed.
        </Body>
      </Card>
      <Section title="On-device by design">
        <Body>
          Bundled sample photos, review decisions, album memberships, and
          preference signals stay in local SQLite. There is no account, cloud
          analysis, advertising, or photo telemetry.
        </Body>
      </Section>
      <Card>
        <View style={s.spread}>
          <View style={{ flex: 1, gap: 8 }}>
            <Label>Organization preview</Label>
            <Body>Show recently organized sample photos on Home.</Body>
          </View>
          <Switch
            accessibilityLabel="Show demo organization previews"
            value={state.organizationPreview}
            disabled={busy}
            onValueChange={(value) =>
              void update((current) => ({
                ...current,
                organizationPreview: value,
              }))
            }
            trackColor={{ false: c.deepTeal, true: c.teal }}
            thumbColor={c.mist}
          />
        </View>
        <Body>
          Real automatic organization requires M2. iOS background work is
          opportunistic, with catch-up when the app opens.
        </Body>
      </Card>
      <Card>
        <Label>Apple Photos album synchronization</Label>
        <Body>
          Future integration. App collections currently reference demo photos
          only; they never modify Apple Photos.
        </Body>
      </Card>
      <Section title="Personal intelligence">
        <RowLink
          title="Learning preferences"
          detail="Review signals, correct preferences, or Reset Learning"
          onPress={() => router.push("/learning")}
        />
      </Section>
      <Section title="Local data controls">
        <Body>
          Reset restores the sample library and removes all local review
          history, custom albums, corrections, preferences, and settings. Your
          real photos are unaffected.
        </Body>
        {confirming ? (
          <Card>
            <Label>Reset demonstration data?</Label>
            <Button title="Cancel" onPress={() => setConfirming(false)} />
            <Button
              secondary
              title="Confirm reset demo data"
              disabled={busy}
              onPress={() => {
                void update(() => initialState());
                setConfirming(false);
              }}
            />
          </Card>
        ) : (
          <Button
            secondary
            title="Reset demonstration data"
            onPress={() => setConfirming(true)}
          />
        )}
      </Section>
      <Card>
        <Label>VYNE · M1 / 0.1.0</Label>
        <Body>Your life in focus.</Body>
        <Body>
          Working name and provisional ribbon mark. Local deterministic feedback
          is not a trained AI model. Native PhotoKit and Vision functionality
          remain future work.
        </Body>
        <RowLink
          title="Demo photography credits"
          detail="Bundled images and license information"
          onPress={() => router.push("/credits")}
        />
      </Card>
    </Screen>
  );
}
