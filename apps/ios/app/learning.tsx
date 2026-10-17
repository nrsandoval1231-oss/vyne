import { useState } from "react";
import { View } from "react-native";
import {
  Screen,
  Label,
  Body,
  Card,
  Button,
  Section,
  Chip,
  s,
} from "../src/components/ui";
import { photos } from "../src/data/demo";
import { useLibrary } from "../src/state/LibraryProvider";
import {
  preferenceSignals,
  resetLearning,
} from "../../../packages/intelligence/src";
export default function Learning() {
  const { state, update, busy } = useLibrary();
  const signals = preferenceSignals(state, photos);
  const [confirming, setConfirming] = useState(false);
  const examples = state.decisions
    .filter((d) => !state.learningSince || d.timestamp > state.learningSince)
    .slice(-4)
    .reverse();
  const corrections = state.corrections
    .filter((d) => !state.learningSince || d.timestamp > state.learningSince)
    .slice(-3)
    .reverse();
  return (
    <Screen
      back
      title="What matters to you."
      subtitle="A little understanding, built one decision at a time."
    >
      <Label>Local feedback · deterministic, not trained AI</Label>
      <Card>
        <Body>
          Keep and review intentions build category counts on this device.
          Corrected album assignments provide context. Skip is uncertainty,
          never a vote to remove. These signals add review hints; they never
          override memory protection.
        </Body>
        <Button
          secondary
          title={state.learningEnabled ? "Pause learning" : "Resume learning"}
          disabled={busy}
          onPress={() =>
            void update((current) => ({
              ...current,
              learningEnabled: !current.learningEnabled,
            }))
          }
        />
      </Card>
      <Section title="Your preferences">
        {!signals.size && (
          <Body>
            {state.learningEnabled
              ? "Your preferences begin with a choice. Review a few demo groups to see them here."
              : "Learning is paused. Existing feedback stays local."}
          </Body>
        )}
        {[...signals].map(([category, score]) => (
          <Card key={category}>
            <Label>{category}</Label>
            <Body>
              {score.keep} keep signals · {score.remove} removal-review signals
            </Body>
            <Body>
              {score.keep >= score.remove
                ? "You lean toward keeping these moments."
                : "You more often set these aside for review."}
            </Body>
            <Button
              secondary
              title="Ignore this category signal"
              onPress={() =>
                void update((current) => ({
                  ...current,
                  ignoredCategories: [
                    ...new Set([...current.ignoredCategories, category]),
                  ],
                }))
              }
            />
          </Card>
        ))}
      </Section>
      {state.ignoredCategories.length > 0 && (
        <Section title="Ignored preferences">
          <View style={s.grid}>
            {state.ignoredCategories.map((category) => (
              <Chip
                key={category}
                title={`Restore ${category}`}
                onPress={() =>
                  void update((current) => ({
                    ...current,
                    ignoredCategories: current.ignoredCategories.filter(
                      (c) => c !== category,
                    ),
                  }))
                }
              />
            ))}
          </View>
        </Section>
      )}
      <Section title="The choices behind the hints">
        {examples.length === 0 && (
          <Body>No review examples since your last learning reset.</Body>
        )}
        {examples.map((d) => (
          <Card key={d.id}>
            <Label>
              {d.action === "review_for_deletion" ? "Removal review" : d.action}
            </Label>
            <Body>
              {d.assetIds.length} sample photos · {d.timestamp.slice(0, 10)}
            </Body>
          </Card>
        ))}
        {corrections.map((item, i) => (
          <Body key={`${item.timestamp}-${i}`}>
            {item.assigned ? "Added to" : "Removed from"}{" "}
            {state.albums.find((a) => a.id === item.albumId)?.name} ·{" "}
            {photos.find((p) => p.id === item.photoId)?.title}
          </Body>
        ))}
      </Section>
      {confirming ? (
        <Card>
          <Body>
            Reset preference signals? Review history and album assignments will
            remain. No photos are affected.
          </Body>
          <Button
            title="Keep learning history"
            onPress={() => setConfirming(false)}
          />
          <Button
            secondary
            title="Confirm Reset Learning"
            disabled={busy}
            onPress={() => {
              void update((current) =>
                resetLearning(current, new Date().toISOString()),
              );
              setConfirming(false);
            }}
          />
        </Card>
      ) : (
        <Button
          secondary
          title="Reset Learning"
          onPress={() => setConfirming(true)}
        />
      )}
    </Screen>
  );
}
