import type { LocalState } from "../../../../packages/domain/src";
import { initialState } from "../data/demo";
import { decodeSnapshot, SnapshotError } from "./snapshot";
export { SnapshotError } from "./snapshot";
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
export async function initialize(db: Database) {
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS snapshot_recovery (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, reason TEXT NOT NULL, recovered_at TEXT NOT NULL);",
  );
}
async function readPayload(db: Database) {
  return db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM local_state WHERE id = 1",
  );
}
export async function readState(db: Database): Promise<LocalState | null> {
  const row = await readPayload(db);
  return row ? decodeSnapshot(row.payload) : null;
}
export async function writeState(db: Database, state: LocalState) {
  await db.runAsync(
    "INSERT INTO local_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload",
    JSON.stringify(state),
  );
}
async function transaction<T>(
  db: Database,
  operation: () => Promise<T>,
): Promise<T> {
  await db.execAsync("BEGIN IMMEDIATE");
  try {
    const result = await operation();
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
/** Explicit consent only. Archive and replacement succeed or fail together.
 * Re-read under the write lock so stale recovery screens cannot overwrite newer data.
 */
export async function recoverSnapshot(
  db: Database,
  issue: SnapshotError,
  mode: "salvage" | "fresh",
): Promise<LocalState> {
  return transaction(db, async () => {
    const row = await readPayload(db);
    if (!row || row.payload !== issue.payload)
      throw new Error("Snapshot changed. Retry loading before recovery.");
    const replacement = mode === "salvage" ? issue.recoverable : initialState();
    if (!replacement)
      throw new Error(
        "This snapshot cannot be safely recovered by this app version.",
      );
    const validated = decodeSnapshot(JSON.stringify(replacement));
    await db.runAsync(
      "INSERT INTO snapshot_recovery (payload, reason, recovered_at) VALUES (?, ?, ?)",
      row.payload,
      issue.kind,
      new Date().toISOString(),
    );
    await writeState(db, validated);
    return validated;
  });
}
/** The existing explicit Settings reset also clears any retained recovery archives. */
export async function resetState(db: Database, state: LocalState) {
  await transaction(db, async () => {
    await db.execAsync("DELETE FROM snapshot_recovery");
    await writeState(db, state);
  });
}
