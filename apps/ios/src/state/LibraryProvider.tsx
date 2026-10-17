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
import { initialize, readState, writeState } from "../services/persistence";

type Store = {
  state: LocalState;
  update: (fn: (state: LocalState) => LocalState) => Promise<void>;
  busy: boolean;
  error: string | null;
};
const Context = createContext<Store | null>(null);
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useRef<LocalState | null>(null);
  const db = useRef<SQLite.SQLiteDatabase | null>(null);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const database = await SQLite.openDatabaseAsync("vyne-demo.db");
        await initialize(database);
        const saved = (await readState(database)) ?? initialState();
        await writeState(database, saved);
        if (active) {
          db.current = database;
          current.current = saved;
          setState(saved);
        }
      } catch {
        if (active)
          setError(
            "Local data could not be opened. Restart VYNE to retry. Your photos have not been accessed.",
          );
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  function update(fn: (previous: LocalState) => LocalState) {
    pending.current++;
    setBusy(true);
    const next = queue.current.then(async () => {
      if (!db.current || !current.current) throw new Error("Library not ready");
      const value = fn(current.current);
      await writeState(db.current, value);
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
    <Context.Provider value={{ state, update, busy, error }}>
      {children}
    </Context.Provider>
  );
}
export function useLibrary() {
  const store = useContext(Context);
  if (!store) throw new Error("LibraryProvider is required");
  return store;
}
