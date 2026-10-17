import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialState, groups, photos } from "../apps/ios/src/data/demo";
import { applyDecision, setMembership } from "../packages/intelligence/src";
import {
  initialize,
  readState,
  writeState,
  recoverSnapshot,
  resetState,
  SnapshotError,
  type Database,
} from "../apps/ios/src/services/persistence";
const time = "2026-10-17T12:00:00.000Z";
function adapter(sqlite: DatabaseSync): Database {
  return {
    execAsync: async (sql) => {
      sqlite.exec(sql);
    },
    runAsync: async (sql, ...params) => sqlite.prepare(sql).run(...params),
    getFirstAsync: async <T>(
      sql: string,
      ...params: (string | number | null)[]
    ) => (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
  };
}
async function seed(db: Database, payload: string) {
  await db.runAsync(
    "INSERT OR REPLACE INTO local_state VALUES (1, ?)",
    payload,
  );
}
async function issue(db: Database) {
  try {
    await readState(db);
    assert.fail("Expected unreadable snapshot");
  } catch (error) {
    assert.ok(error instanceof SnapshotError);
    return error;
  }
}
async function archived(db: Database) {
  return db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM snapshot_recovery ORDER BY id DESC LIMIT 1",
  );
}
function savedState() {
  let state = applyDecision(initialState(), groups[0], photos, "keep", time);
  state = {
    ...state,
    albums: [
      ...state.albums,
      { id: "custom-test", name: "My memories", custom: true },
    ],
    learningEnabled: false,
    learningSince: time,
    ignoredCategories: ["trips"],
    organizationPreview: false,
  };
  return setMembership(state, "pet-1", "custom-test", true, time);
}
for (const [name, payload, kind] of [
  ["truncated JSON", '{"version":1,"decisions":', "malformed"],
  ["null root", "null", "damaged"],
  ["array root", "[]", "damaged"],
  [
    "future schema",
    JSON.stringify({ ...savedState(), version: 99 }),
    "unsupported",
  ],
] as const) {
  test(`${name}: retry is nondestructive; confirmed fresh recovery survives database close/reopen`, async () => {
    const directory = mkdtempSync(join(tmpdir(), "vyne-recovery-"));
    const file = join(directory, "library.db");
    let sqlite = new DatabaseSync(file);
    let db = adapter(sqlite);
    try {
      await initialize(db);
      await seed(db, payload);
      const failure = await issue(db);
      assert.equal(failure.kind, kind);
      assert.equal(failure.recoverable, null);
      await issue(db);
      assert.equal(await archived(db), null);
      assert.equal(
        (
          await db.getFirstAsync<{ payload: string }>(
            "SELECT payload FROM local_state",
          )
        )?.payload,
        payload,
      );
      await assert.rejects(
        recoverSnapshot(db, failure, "salvage"),
        /cannot be safely recovered/,
      );
      await recoverSnapshot(db, failure, "fresh");
      assert.equal((await archived(db))?.payload, payload);
      sqlite.close();
      sqlite = new DatabaseSync(file);
      db = adapter(sqlite);
      await initialize(db);
      assert.deepEqual(await readState(db), initialState());
      assert.equal((await archived(db))?.payload, payload);
      await writeState(db, savedState());
      assert.deepEqual(await readState(db), savedState());
    } finally {
      sqlite.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
test("deep corruption retains valid reviews, custom albums, assignments, corrections and preference controls", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  try {
    await initialize(db);
    const original = savedState();
    const damaged = {
      ...original,
      decisions: [
        ...original.decisions,
        null,
        { id: "broken", assetIds: "not-an-array" },
      ],
      albums: [...original.albums, { id: "broken", name: 42 }],
      memberships: {
        ...original.memberships,
        "pet-1": [...original.memberships["pet-1"], "unknown", null],
        "lake-2": 7,
      },
      corrections: [
        ...original.corrections,
        {
          photoId: "pet-1",
          albumId: "unknown",
          assigned: true,
          timestamp: time,
        },
      ],
    };
    const payload = JSON.stringify(damaged);
    await seed(db, payload);
    const failure = await issue(db);
    assert.ok(failure.recoverable);
    assert.equal(failure.kind, "damaged");
    assert.ok(failure.repairs >= 5);
    const expected = {
      ...original,
      memberships: { ...original.memberships, "lake-2": [] },
    };
    assert.deepEqual(failure.recoverable, expected);
    await recoverSnapshot(db, failure, "salvage");
    assert.deepEqual(await readState(db), expected);
    assert.equal((await archived(db))?.payload, payload);
    await initialize(db);
    assert.deepEqual(await readState(db), expected);
  } finally {
    sqlite.close();
  }
});
test("missing nested fields, duplicate IDs and wrong scalar types cannot reach UI; required albums are restored", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  try {
    await initialize(db);
    const state = savedState();
    await seed(
      db,
      JSON.stringify({
        ...state,
        albums: [state.albums[0], state.albums[0]],
        memberships: [],
        learningEnabled: "yes",
        learningSince: 3,
        organizationPreview: null,
        ignoredCategories: [null, "unknown"],
        decisions: [
          { ...state.decisions[0], assetIds: ["not-a-photo"] },
          { ...state.decisions[0], action: "delete_approved" },
        ],
      }),
    );
    const failure = await issue(db);
    const restored = await recoverSnapshot(db, failure, "salvage");
    assert.ok(restored.albums.some((a) => a.id === "trips"));
    assert.equal(restored.decisions.length, 0);
    assert.equal(restored.learningEnabled, false);
    assert.deepEqual(restored.ignoredCategories, []);
    assert.equal(restored.organizationPreview, false);
    assert.deepEqual(await readState(db), restored);
  } finally {
    sqlite.close();
  }
});
for (const stage of ["archive", "replacement", "commit"] as const) {
  test(`${stage} failure rolls back archive and active snapshot; a second recovery succeeds`, async () => {
    const sqlite = new DatabaseSync(":memory:");
    const db = adapter(sqlite);
    try {
      await initialize(db);
      const payload = "broken";
      await seed(db, payload);
      const failure = await issue(db);
      const failing: Database = {
        ...db,
        runAsync: async (sql, ...params) => {
          if (
            (stage === "archive" &&
              sql.startsWith("INSERT INTO snapshot_recovery")) ||
            (stage === "replacement" &&
              sql.startsWith("INSERT INTO local_state"))
          )
            throw new Error("Simulated write failure");
          return db.runAsync(sql, ...params);
        },
        execAsync: async (sql) => {
          if (stage === "commit" && sql === "COMMIT")
            throw new Error("Simulated commit failure");
          return db.execAsync(sql);
        },
      };
      await assert.rejects(
        recoverSnapshot(failing, failure, "fresh"),
        /Simulated/,
      );
      assert.equal((await issue(db)).payload, payload);
      assert.equal(await archived(db), null);
      await recoverSnapshot(db, failure, "fresh");
      assert.deepEqual(await readState(db), initialState());
      assert.equal((await archived(db))?.payload, payload);
    } finally {
      sqlite.close();
    }
  });
}
test("stale recovery never overwrites a repaired snapshot; retry loads it unchanged", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  try {
    await initialize(db);
    await seed(db, "broken");
    const failure = await issue(db);
    await writeState(db, savedState());
    await assert.rejects(
      recoverSnapshot(db, failure, "fresh"),
      /Snapshot changed/,
    );
    assert.equal(await archived(db), null);
    assert.deepEqual(await readState(db), savedState());
  } finally {
    sqlite.close();
  }
});
test("explicit Settings reset clears recovery archives and active user data together", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  try {
    await initialize(db);
    await seed(db, "broken");
    await recoverSnapshot(db, await issue(db), "fresh");
    await writeState(db, savedState());
    await resetState(db, initialState());
    assert.equal(await archived(db), null);
    assert.deepEqual(await readState(db), initialState());
  } finally {
    sqlite.close();
  }
});

test("failed Settings reset preserves both the recovered library and its archive", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = adapter(sqlite);
  try {
    await initialize(db);
    await seed(db, "broken");
    await recoverSnapshot(db, await issue(db), "fresh");
    await writeState(db, savedState());
    await db.execAsync(
      "CREATE TRIGGER reject_reset BEFORE UPDATE ON local_state BEGIN SELECT RAISE(ABORT, 'Simulated reset failure'); END;",
    );
    await assert.rejects(
      resetState(db, initialState()),
      /Simulated reset failure/,
    );
    assert.equal((await archived(db))?.payload, "broken");
    assert.deepEqual(await readState(db), savedState());
  } finally {
    sqlite.close();
  }
});
