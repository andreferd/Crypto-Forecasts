import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DigestSnapshot,
  AlertBaselines,
  AlertSettings,
  AccuracyLog,
  DailyAccuracyEntry,
  UserPrediction,
  PredictionStore,
} from '../types/storage';

const PREFIX = '@crypto-forecasts/';

const KEYS = {
  digestSnapshot: `${PREFIX}digest-snapshot`,
  alertBaselines: `${PREFIX}alert-baselines`,
  alertSettings: `${PREFIX}alert-settings`,
  accuracyLog: `${PREFIX}accuracy-log`,
  userPredictions: `${PREFIX}user-predictions`,
  driftNotified: `${PREFIX}drift-notified`,
} as const;

// ─── Helpers ──────────────────────────────────────────────

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── Digest ───────────────────────────────────────────────

export async function getDigestSnapshot(): Promise<DigestSnapshot | null> {
  return getJSON<DigestSnapshot>(KEYS.digestSnapshot);
}

export async function saveDigestSnapshot(snapshot: DigestSnapshot): Promise<void> {
  await setJSON(KEYS.digestSnapshot, snapshot);
}

// ─── Alert Baselines ──────────────────────────────────────

export async function getAlertBaselines(): Promise<AlertBaselines | null> {
  return getJSON<AlertBaselines>(KEYS.alertBaselines);
}

export async function saveAlertBaselines(baselines: AlertBaselines): Promise<void> {
  await setJSON(KEYS.alertBaselines, baselines);
}

// ─── Alert Settings ───────────────────────────────────────

export async function getAlertSettings(): Promise<AlertSettings> {
  const settings = await getJSON<AlertSettings>(KEYS.alertSettings);
  return settings ?? { enabled: false, thresholdPercent: 5 };
}

export async function saveAlertSettings(settings: AlertSettings): Promise<void> {
  await setJSON(KEYS.alertSettings, settings);
}

// ─── Accuracy Log ─────────────────────────────────────────

export async function getAccuracyLog(): Promise<AccuracyLog> {
  const log = await getJSON<AccuracyLog>(KEYS.accuracyLog);
  return log ?? { entries: [] };
}

export async function appendAccuracyEntry(entry: DailyAccuracyEntry): Promise<void> {
  const log = await getAccuracyLog();
  log.entries.push(entry);

  // Prune entries older than 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  log.entries = log.entries.filter((e) => e.timestamp > cutoff);

  await setJSON(KEYS.accuracyLog, log);
}

// ─── User Predictions ─────────────────────────────────────

export async function getUserPredictions(): Promise<UserPrediction[]> {
  const store = await getJSON<PredictionStore>(KEYS.userPredictions);
  return store?.predictions ?? [];
}

export async function addUserPrediction(prediction: UserPrediction): Promise<void> {
  const predictions = await getUserPredictions();
  predictions.push(prediction);
  await setJSON(KEYS.userPredictions, { predictions });
}

export async function removeUserPrediction(id: string): Promise<void> {
  const predictions = await getUserPredictions();
  const filtered = predictions.filter((p) => p.id !== id);
  await setJSON(KEYS.userPredictions, { predictions: filtered });
}

// ─── Drift Notifications ──────────────────────────────────
// Tracks the last notified drift magnitude per predictionId so we don't spam.

export type DriftNotifiedMap = Record<string, number>;

export async function getDriftNotified(): Promise<DriftNotifiedMap> {
  const map = await getJSON<DriftNotifiedMap>(KEYS.driftNotified);
  return map ?? {};
}

export async function saveDriftNotified(map: DriftNotifiedMap): Promise<void> {
  await setJSON(KEYS.driftNotified, map);
}
