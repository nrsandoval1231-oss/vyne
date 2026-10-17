import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as SQLite from "expo-sqlite";
import type { LocalState } from "../../../../packages/domain/src";
import { colors } from "../../../../packages/design-tokens/src";
import { initialState } from "../data/demo";
import {
  initialize,
  readState,
  writeState,
  recoverSnapshot,
  resetState,
  SnapshotError,
} from "../services/persistence";
import { LibraryRecovery } from "../components/LibraryRecovery";

type Store = {
  state: LocalState;
  update: (fn: (state: LocalState) => LocalState) => Promise<void>;
  reset: () => Promise<void>;
  busy: boolean;
  error: string | null;
};
const Context = createContext<Store | null>(null);
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [issue, setIssue] = useState<SnapshotError | null>(null);
  const opening = useRef<Promise<SQLite.SQLiteDatabase> | null>(null);
  const recovering = useRef(false);
  const current = useRef<LocalState | null>(null);
  const db = useRef<SQLite.SQLiteDatabase | null>(null);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setIssue(null);
      try {
        opening.current ??= SQLite.openDatabaseAsync("vyne-demo.db").catch(
          (error) => {
            opening.current = null;
            throw error;
          },
        );
        const database = await opening.current;
        db.current = database;
        await initialize(database);
        const existing = await readState(database);
        const saved = existing ?? initialState();
        if (!existing) await writeState(database, saved);
        if (active) {
          db.current = database;
          current.current = saved;
          setState(saved);
        }
      } catch (failure) {
        if (active) {
          setIssue(failure instanceof SnapshotError ? failure : null);
          setError(
            failure instanceof SnapshotError
              ? null
              : "Local data is temporarily unavailable. Try again to reopen it.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);
  async function recover(mode: "salvage" | "fresh") {
    if (!issue || !db.current || recovering.current) return;
    recovering.current = true;
    setLoading(true);
    setError(null);
    try {
      const saved = await recoverSnapshot(db.current, issue, mode);
      current.current = saved;
      setState(saved);
      setIssue(null);
    } catch {
      setError(
        "Recovery could not be saved. Your original snapshot has not been replaced. Cancel and try loading again, or retry recovery.",
      );
    } finally {
      recovering.current = false;
      setLoading(false);
    }
  }
  function update(
    fn: (previous: LocalState) => LocalState,
    clearArchives = false,
  ) {
    pending.current++;
    setBusy(true);
    const next = queue.current.then(async () => {
      if (!db.current || !current.current) throw new Error("Library not ready");
      const value = fn(current.current);
      if (clearArchives) await resetState(db.current, value);
      else await writeState(db.current, value);
      current.current = value;
      setState(value);
      setError(null);
    });
    queue.current = next.catch(() => {
      setError("Your change could not be saved. Please try again.");
    });
    void queue.current.then(() => {
      pending.current--;
      setBusy(pending.current > 0);
    });
    return queue.current;
  }
  if (!state && (issue || error || !loading))
    return (
      <LibraryRecovery
        key={attempt}
        issue={issue}
        pending={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setAttempt((value) => value + 1);
        }}
        onRecover={(mode) => void recover(mode)}
      />
    );
  if (!state)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.midnight,
          justifyContent: "center",
          padding: 32,
        }}
      >
        <ActivityIndicator color={colors.seaGlass} />
        <Text
          accessibilityRole="alert"
          style={{ color: colors.mist, marginTop: 20 }}
        >
          {error ?? "Opening your demonstration library…"}
        </Text>
      </View>
    );
  return (
    <Context.Provider
      value={{
        state,
        update,
        reset: () => update(initialState, true),
        busy,
        error,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLibrary() {
  const store = useContext(Context);
  if (!store) throw new Error("LibraryProvider is required");
  return store;
}
