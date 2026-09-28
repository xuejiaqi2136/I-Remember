import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as db from '@/lib/db';
import type { AdviceRecord, Memo, MemoStep, ReminderRule } from '@/lib/types';

type MemoContextValue = {
  ready: boolean;
  memos: Memo[];
  refresh: () => Promise<void>;
  createMemo: (input: { title: string; note?: string; dueAt?: string | null }) => Promise<Memo>;
  updateMemo: (
    id: string,
    patch: Partial<Omit<Memo, 'id' | 'createdAt'>>
  ) => Promise<Memo | null>;
  removeMemo: (id: string) => Promise<void>;
  getMemo: (id: string) => Memo | undefined;
  setSteps: (id: string, steps: MemoStep[]) => Promise<Memo | null>;
  appendAdvice: (id: string, record: AdviceRecord) => Promise<Memo | null>;
  setReminder: (id: string, rule: ReminderRule | null) => Promise<Memo | null>;
};

const MemoContext = createContext<MemoContextValue | null>(null);

export function MemoProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);

  const refresh = useCallback(async () => {
    const rows = await db.listMemos();
    setMemos(rows);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch(() => setReady(true));
  }, [refresh]);

  const createMemo = useCallback(
    async (input: { title: string; note?: string; dueAt?: string | null }) => {
      const memo = await db.createMemo(input);
      await refresh();
      return memo;
    },
    [refresh]
  );

  const updateMemo = useCallback(
    async (id: string, patch: Partial<Omit<Memo, 'id' | 'createdAt'>>) => {
      const memo = await db.updateMemo(id, patch);
      await refresh();
      return memo;
    },
    [refresh]
  );

  const removeMemo = useCallback(
    async (id: string) => {
      await db.deleteMemo(id);
      await refresh();
    },
    [refresh]
  );

  const getMemo = useCallback((id: string) => memos.find((m) => m.id === id), [memos]);

  const setSteps = useCallback(
    async (id: string, steps: MemoStep[]) => {
      const memo = await db.setSteps(id, steps);
      await refresh();
      return memo;
    },
    [refresh]
  );

  const appendAdvice = useCallback(
    async (id: string, record: AdviceRecord) => {
      const memo = await db.appendAdvice(id, record);
      await refresh();
      return memo;
    },
    [refresh]
  );

  const setReminder = useCallback(
    async (id: string, rule: ReminderRule | null) => {
      const memo = await db.updateMemo(id, { reminderRule: rule });
      await refresh();
      return memo;
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      ready,
      memos,
      refresh,
      createMemo,
      updateMemo,
      removeMemo,
      getMemo,
      setSteps,
      appendAdvice,
      setReminder,
    }),
    [
      ready,
      memos,
      refresh,
      createMemo,
      updateMemo,
      removeMemo,
      getMemo,
      setSteps,
      appendAdvice,
      setReminder,
    ]
  );

  return <MemoContext.Provider value={value}>{children}</MemoContext.Provider>;
}

export function useMemos() {
  const ctx = useContext(MemoContext);
  if (!ctx) throw new Error('useMemos must be used within MemoProvider');
  return ctx;
}
