/** Playwright-only Metro entry. Not imported by any app route or production bundle.
 * Runs in a separate test page to seed/inspect real browser SQLite while the app is closed.
 */
import * as SQLite from "expo-sqlite";
import { initialize } from "../src/services/persistence";
import { initialState, groups, photos } from "../src/data/demo";
import {
  applyDecision,
  setMembership,
} from "../../../packages/intelligence/src";
declare global {
  var recoveryFixtureMode: "malformed" | "unsupported" | "partial" | "inspect";
  var recoveryFixtureResult:
    | { payload: string | null; archived: string | null; error?: string }
    | undefined;
}
async function run() {
  const db = await SQLite.openDatabaseAsync("vyne-demo.db");
  try {
    await initialize(db);
    if (globalThis.recoveryFixtureMode !== "inspect") {
      let state = applyDecision(
        initialState(),
        groups[0],
        photos,
        "keep",
        "2026-10-17T12:00:00.000Z",
      );
      state = {
        ...state,
        albums: [
          ...state.albums,
          { id: "custom-recovery", name: "Recovered memories", custom: true },
        ],
        organizationPreview: false,
      };
      state = setMembership(
        state,
        "pet-1",
        "custom-recovery",
        true,
        "2026-10-17T12:00:00.000Z",
      );
      const payload =
        globalThis.recoveryFixtureMode === "malformed"
          ? '{"version":1,'
          : JSON.stringify(
              globalThis.recoveryFixtureMode === "unsupported"
                ? { ...state, version: 99 }
                : {
                    ...state,
                    decisions: [...state.decisions, null],
                    memberships: { ...state.memberships, "lake-2": 42 },
                  },
            );
      await db.execAsync("DELETE FROM snapshot_recovery");
      await db.runAsync(
        "INSERT OR REPLACE INTO local_state VALUES (1, ?)",
        payload,
      );
    }
    const row = await db.getFirstAsync<{ payload: string }>(
      "SELECT payload FROM local_state WHERE id = 1",
    );
    const archive = await db.getFirstAsync<{ payload: string }>(
      "SELECT payload FROM snapshot_recovery ORDER BY id DESC LIMIT 1",
    );
    return {
      payload: row?.payload ?? null,
      archived: archive?.payload ?? null,
    };
  } finally {
    await db.closeAsync();
  }
}
void run()
  .then((result) => {
    globalThis.recoveryFixtureResult = result;
  })
  .catch((error: unknown) => {
    globalThis.recoveryFixtureResult = {
      payload: null,
      archived: null,
      error:
        error instanceof Error
          ? error.message
          : "Fixture database operation failed",
    };
  });
