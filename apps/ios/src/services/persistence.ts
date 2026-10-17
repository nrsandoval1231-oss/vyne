import type { LocalState } from "../../../../packages/domain/src";
export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<unknown>;
  getFirstAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T | null>;
}
/** Versioned, atomic snapshot. All UI mutations are serialized by the provider. */
export async function initialize(db: Database) {
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);",
  );
}
export async function readState(db: Database): Promise<LocalState | null> {
  const row = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM local_state WHERE id = 1",
  );
  if (!row) return null;
  const state: LocalState = JSON.parse(row.payload);
  if (
    state.version !== 1 ||
    !Array.isArray(state.decisions) ||
    !Array.isArray(state.albums) ||
    !state.memberships ||
    !Array.isArray(state.corrections) ||
    !Array.isArray(state.ignoredCategories) ||
    typeof state.learningEnabled !== "boolean"
  )
    throw new Error(
      "Unsupported or damaged local data. No data was overwritten.",
    );
  return state;
}
export async function writeState(db: Database, state: LocalState) {
  await db.runAsync(
    "INSERT INTO local_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload",
    JSON.stringify(state),
  );
}
