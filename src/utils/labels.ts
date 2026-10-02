import { MedicationCategory, RouteOfAdmin, DoseFrequency } from '../types/medication';

export const CATEGORY_LABELS: Record<MedicationCategory, { label: string; bg: string; text: string; border: string; icon: string }> = {
  prescription: { label: '慢箋處方藥', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: '🩺' },
  otc: { label: '常備成藥', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: '🩹' },
  supplement: { label: '元氣保健品', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: '✨' },
  herbal: { label: '漢方中藥', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: '🌿' },
  topical: { label: '外用藥劑', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: '💧' },
  other: { label: '其他常備', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '📦' },
};

export const ROUTE_LABELS: Record<RouteOfAdmin, string> = {
  oral: '口服',
  topical: '外用塗抹',
  patch: '外敷貼片',
  eyedrop: '眼藥水 / 滴眼',
  inhaler: '吸入劑',
  injection: '皮下 / 肌肉注射',
  spray: '噴劑',
  other: '其他途徑',
};

/** 常見用法時段 (飯前、飯後、睡前、需要時使用) */
export const USAGE_SLOT_LABELS: Record<string, { name: string; shortName: string; desc: string; icon: string }> = {
  AC: { name: '飯前 (AC)', shortName: '飯前', desc: '用餐前 30 分鐘', icon: '🍙' },
  PC: { name: '飯後 (PC)', shortName: '飯後', desc: '用餐後 30 分鐘', icon: '🍱' },
  QN: { name: '睡前 (QN)', shortName: '睡前', desc: '就寢前固定服用', icon: '🌙' },
  PRN: { name: '需要時使用 (PRN)', shortName: '需要時', desc: '有症狀或不適時服用', icon: '⭐' },
};

export const FREQUENCY_LABELS: Record<DoseFrequency, string> = {
  QD: '每日 1 次 (QD)',
  BID: '每日 2 次 (BID)',
  TID: '每日 3 次 (TID)',
  QID: '每日 4 次 (QID)',
  QOD: '隔日 1 次 (QOD)',
  WEEKLY: '每週固定天數',
  PRN: '需要時服用 (PRN)',
};

export const FREQUENCY_FACTORS: Record<DoseFrequency, number> = {
  QD: 1,
  BID: 2,
  TID: 3,
  QID: 4,
  QOD: 0.5,
  WEEKLY: 1 / 7,
  PRN: 0,
};

export const STORAGE_LABELS: Record<string, string> = {
  room: '常溫避光保存 (15-25°C)',
  refrigerated: '冷藏保存 (2-8°C)',
  dark: '避光遮光保存',
  dry: '防潮密封保存',
};
