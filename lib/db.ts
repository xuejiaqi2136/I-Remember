import * as SQLite from 'expo-sqlite';

import { createId } from '@/lib/id';
import type { AdviceRecord, Memo, MemoStep, ReminderRule } from '@/lib/types';

const DB_NAME = 'wojizene.db';

type MemoRow = {
  id: string;
  title: string;
  note: string;
  status: string;
  created_at: string;
  updated_at: string;
  due_at: string | null;
  reminder_json: string | null;
  steps_json: string;
  advice_json: string;
  snooze_count: number;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS memos (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          due_at TEXT,
          reminder_json TEXT,
          steps_json TEXT NOT NULL DEFAULT '[]',
          advice_json TEXT NOT NULL DEFAULT '[]',
          snooze_count INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

function rowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    note: row.note ?? '',
    status: row.status === 'done' ? 'done' : 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dueAt: row.due_at,
    reminderRule: row.reminder_json ? (JSON.parse(row.reminder_json) as ReminderRule) : null,
    steps: JSON.parse(row.steps_json || '[]') as MemoStep[],
    adviceHistory: JSON.parse(row.advice_json || '[]') as AdviceRecord[],
    snoozeCount: row.snooze_count ?? 0,
  };
}

export async function listMemos(): Promise<Memo[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MemoRow>(
    `SELECT * FROM memos ORDER BY
      CASE status WHEN 'pending' THEN 0 ELSE 1 END,
      updated_at DESC`
  );
  return rows.map(rowToMemo);
}

export async function getMemo(id: string): Promise<Memo | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MemoRow>(`SELECT * FROM memos WHERE id = ?`, [id]);
  return row ? rowToMemo(row) : null;
}

export async function createMemo(input: {
  title: string;
  note?: string;
  dueAt?: string | null;
}): Promise<Memo> {
  const db = await getDb();
  const now = new Date().toISOString();
  const memo: Memo = {
    id: createId('memo'),
    title: input.title.trim(),
    note: (input.note ?? '').trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    dueAt: input.dueAt ?? null,
    reminderRule: null,
    steps: [],
    adviceHistory: [],
    snoozeCount: 0,
  };
  await db.runAsync(
    `INSERT INTO memos (
      id, title, note, status, created_at, updated_at, due_at,
      reminder_json, steps_json, advice_json, snooze_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      memo.id,
      memo.title,
      memo.note,
      memo.status,
      memo.createdAt,
      memo.updatedAt,
      memo.dueAt,
      null,
      '[]',
      '[]',
      0,
    ]
  );
  return memo;
}

async function persist(memo: Memo): Promise<Memo> {
  const db = await getDb();
  const updated: Memo = { ...memo, updatedAt: new Date().toISOString() };
  await db.runAsync(
    `UPDATE memos SET
      title = ?, note = ?, status = ?, updated_at = ?, due_at = ?,
      reminder_json = ?, steps_json = ?, advice_json = ?, snooze_count = ?
     WHERE id = ?`,
    [
      updated.title,
      updated.note,
      updated.status,
      updated.updatedAt,
      updated.dueAt,
      updated.reminderRule ? JSON.stringify(updated.reminderRule) : null,
      JSON.stringify(updated.steps),
      JSON.stringify(updated.adviceHistory),
      updated.snoozeCount,
      updated.id,
    ]
  );
  return updated;
}

export async function updateMemo(
  id: string,
  patch: Partial<Omit<Memo, 'id' | 'createdAt'>>
): Promise<Memo | null> {
  const current = await getMemo(id);
  if (!current) return null;
  return persist({ ...current, ...patch, id: current.id, createdAt: current.createdAt });
}

export async function deleteMemo(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM memos WHERE id = ?`, [id]);
}

export async function setSteps(id: string, steps: MemoStep[]): Promise<Memo | null> {
  return updateMemo(id, { steps });
}

export async function appendAdvice(id: string, record: AdviceRecord): Promise<Memo | null> {
  const current = await getMemo(id);
  if (!current) return null;
  return persist({
    ...current,
    adviceHistory: [record, ...current.adviceHistory].slice(0, 20),
  });
}
