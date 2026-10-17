import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initialState, photos, groups } from "../apps/ios/src/data/demo";
import {
  applyDecision,
  eligibleIds,
  latestDecisions,
  preferenceSignals,
  resetLearning,
  setMembership,
  storageSummary,
  personalExplanation,
} from "../packages/intelligence/src";
import {
  initialize,
  readState,
  writeState,
  type Database,
} from "../apps/ios/src/services/persistence";
const time = "2026-10-17T12:00:00.000Z";
test("review intention excludes keeper, preserves originals and can be revised", () => {
  const original = initialState();
  const next = applyDecision(
    original,
    groups[1],
    photos,
    "review_for_deletion",
    time,
  );
  assert.equal(next.decisions[0].assetIds.length, 4);
  assert.ok(!next.decisions[0].assetIds.includes("sport-1"));
  assert.equal(original.decisions.length, 0);
  const revised = applyDecision(next, groups[1], photos, "keep", time + "1");
  assert.equal(latestDecisions(revised.decisions).size, 1);
  assert.equal(storageSummary(photos, groups, revised).queuedBytes, 0);
});
test("protected blurry memory cannot be queued", () => {
  assert.deepEqual(eligibleIds(groups[4], photos), []);
  assert.throws(() =>
    applyDecision(
      initialState(),
      groups[4],
      photos,
      "review_for_deletion",
      time,
    ),
  );
});
test("overlapping storage is counted once; Keep protects across groups", () => {
  let state = initialState();
  const baseline = storageSummary(photos, groups, state);
  assert.equal(baseline.potentialBytes, 24900000);
  state = applyDecision(state, groups[2], photos, "review_for_deletion", time);
  state = applyDecision(state, groups[3], photos, "review_for_deletion", time);
  assert.equal(storageSummary(photos, groups, state).queuedBytes, 1700000);
  state = applyDecision(state, groups[3], photos, "keep", time + "1");
  assert.equal(storageSummary(photos, groups, state).queuedBytes, 0);
});
test("album correction supports multiple memberships, deduplicates and preserves other albums", () => {
  let state = initialState();
  state = setMembership(state, "pet-1", "trips", true, time);
  state = setMembership(state, "pet-1", "trips", true, time);
  assert.deepEqual(
    new Set(state.memberships["pet-1"]),
    new Set(["pets", "family", "trips"]),
  );
  state = setMembership(state, "pet-1", "family", false, time);
  assert.deepEqual(state.memberships["pet-1"], ["pets", "trips"]);
  assert.equal(photos.length, 13);
  assert.throws(() => setMembership(state, "missing", "trips", true, time));
});
test("skips are ambiguous; keep preferences influence explanations; reset preserves review and memberships", () => {
  let state = applyDecision(initialState(), groups[0], photos, "skip", time);
  assert.equal(preferenceSignals(state, photos).size, 0);
  state = applyDecision(state, groups[0], photos, "keep", time);
  assert.equal(preferenceSignals(state, photos).get("trips")?.keep, 2);
  assert.match(
    personalExplanation(state, photos, groups[0])!,
    /tend to keep trips/,
  );
  const reset = resetLearning(state, "2026-10-17T13:00:00.000Z");
  assert.equal(preferenceSignals(reset, photos).size, 0);
  assert.deepEqual(reset.decisions, state.decisions);
  assert.deepEqual(reset.memberships, state.memberships);
});
test("preference corrections and paused learning suppress signals", () => {
  let state = applyDecision(initialState(), groups[0], photos, "keep", time);
  state = { ...state, ignoredCategories: ["trips", "places", "events"] };
  assert.equal(preferenceSignals(state, photos).size, 0);
  state = { ...state, ignoredCategories: [], learningEnabled: false };
  assert.equal(preferenceSignals(state, photos).size, 0);
});
function adapter(sqlite: DatabaseSync): Database {
  return {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    runAsync: async (sql, ...args) => sqlite.prepare(sql).run(...args),
    getFirstAsync: async <T>(
      sql: string,
      ...args: (string | number | null)[]
    ) => (sqlite.prepare(sql).get(...args) as T | undefined) ?? null,
  };
}
test("SQLite persistence round-trips review, corrections, custom albums and resets atomically", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  await initialize(db);
  assert.equal(await readState(db), null);
  let state = applyDecision(
    initialState(),
    groups[1],
    photos,
    "review_for_deletion",
    time,
  );
  state = {
    ...state,
    albums: [...state.albums, { id: "custom", name: "My days", custom: true }],
  };
  state = setMembership(state, "pet-1", "custom", true, time);
  await writeState(db, state);
  assert.deepEqual(await readState(db), state);
  await writeState(db, initialState());
  assert.deepEqual(await readState(db), initialState());
  sqlite.close();
});
test("unknown persistence versions fail without overwriting data", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  await initialize(db);
  await db.runAsync(
    "INSERT INTO local_state VALUES (1, ?)",
    JSON.stringify({ version: 99 }),
  );
  await assert.rejects(readState(db), /Unsupported/);
  sqlite.close();
});

test("decisions made while learning is paused do not become signals after resuming", () => {
  const paused = { ...initialState(), learningEnabled: false };
  const reviewed = applyDecision(paused, groups[0], photos, "keep", time);
  const resumed = { ...reviewed, learningEnabled: true };
  assert.equal(resumed.decisions.length, 1);
  assert.equal(preferenceSignals(resumed, photos).size, 0);
});

test("a Keep in an overlapping group prevents a later removal-review intention", () => {
  const state = applyDecision(initialState(), groups[3], photos, "keep", time);
  assert.deepEqual(eligibleIds(groups[2], photos, state), []);
  assert.throws(() =>
    applyDecision(state, groups[2], photos, "review_for_deletion", time),
  );
  // Revising the Keep in its own group is still permitted.
  assert.equal(
    applyDecision(state, groups[3], photos, "review_for_deletion", time)
      .decisions.length,
    2,
  );
});
