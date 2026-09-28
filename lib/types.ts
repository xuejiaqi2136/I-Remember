export type MemoStatus = 'pending' | 'done';

export type ReminderRepeat = 'once' | 'daily' | 'weekly';

export type ReminderRule = {
  at: string; // ISO datetime for first/next fire (local intent)
  repeat: ReminderRepeat;
  notificationId?: string;
};

export type MemoStep = {
  id: string;
  title: string;
  done: boolean;
  order: number;
};

export type AdviceRecord = {
  id: string;
  question: string;
  answer: string;
  entryIds: string[];
  createdAt: string;
};

export type Memo = {
  id: string;
  title: string;
  note: string;
  status: MemoStatus;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  reminderRule: ReminderRule | null;
  steps: MemoStep[];
  adviceHistory: AdviceRecord[];
  snoozeCount: number;
};

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type HltbTags = {
  money: string;
  time: string;
  will: string;
  benefit: string;
  axis: string;
};

export type HltbEntry = {
  id: string;
  sectionNo: number;
  sectionTitle: string;
  entryNo: number;
  title: string;
  tags: HltbTags;
  evidence: string;
  costScore: number;
  ratioTier: string;
  body: string;
};

export type HltbSection = {
  sectionNo: number;
  title: string;
  file: string;
  question: string;
  entryCount: number;
};
