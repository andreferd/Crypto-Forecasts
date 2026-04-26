import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDigestSnapshot,
  saveDigestSnapshot,
  getAlertBaselines,
  saveAlertBaselines,
  getAlertSettings,
  saveAlertSettings,
  getAccuracyLog,
  appendAccuracyEntry,
  getUserPredictions,
  addUserPrediction,
  removeUserPrediction,
} from './storageService';
import {
  DigestSnapshot,
  AlertBaselines,
  DailyAccuracyEntry,
  UserPrediction,
} from '../types/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('digest snapshot', () => {
  it('returns null when nothing is stored', async () => {
    expect(await getDigestSnapshot()).toBeNull();
  });

  it('round-trips through save/get', async () => {
    const snap: DigestSnapshot = { symbols: [], timestamp: 123 };
    await saveDigestSnapshot(snap);
    expect(await getDigestSnapshot()).toEqual(snap);
  });

  it('writes to the namespaced key', async () => {
    await saveDigestSnapshot({ symbols: [], timestamp: 1 });
    expect(await AsyncStorage.getItem('@crypto-forecasts/digest-snapshot')).toBe(
      JSON.stringify({ symbols: [], timestamp: 1 }),
    );
  });
});

describe('alert baselines', () => {
  it('returns null when absent', async () => {
    expect(await getAlertBaselines()).toBeNull();
  });

  it('round-trips', async () => {
    const b: AlertBaselines = {
      symbols: { BTC: [{ ticker: 'X', displayRange: 'R', probability: 40, floorStrike: null, capStrike: null }] },
      timestamp: 7,
    };
    await saveAlertBaselines(b);
    expect(await getAlertBaselines()).toEqual(b);
  });
});

describe('alert settings', () => {
  it('returns defaults when not set (disabled, 5%)', async () => {
    expect(await getAlertSettings()).toEqual({ enabled: false, thresholdPercent: 5 });
  });

  it('returns stored settings when present', async () => {
    await saveAlertSettings({ enabled: true, thresholdPercent: 10 });
    expect(await getAlertSettings()).toEqual({ enabled: true, thresholdPercent: 10 });
  });
});

describe('accuracy log', () => {
  const DAY = 24 * 60 * 60 * 1000;

  function mkEntry(timestamp: number): DailyAccuracyEntry {
    return {
      date: new Date(timestamp).toISOString().slice(0, 10),
      symbol: 'BTC',
      expectedValue: 100,
      spotPrice: 100,
      timestamp,
    };
  }

  it('returns an empty log when nothing is stored', async () => {
    expect(await getAccuracyLog()).toEqual({ entries: [] });
  });

  it('appends a new entry', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000_000);
    await appendAccuracyEntry(mkEntry(1_000_000_000_000));
    const log = await getAccuracyLog();
    expect(log.entries).toHaveLength(1);
  });

  it('prunes entries older than 90 days on write', async () => {
    const now = 1_000_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const old = mkEntry(now - 100 * DAY); // 100 days ago — should be pruned
    const recent = mkEntry(now - 10 * DAY); // within window
    // seed both via append
    await appendAccuracyEntry(old);
    await appendAccuracyEntry(recent);

    const log = await getAccuracyLog();
    expect(log.entries.map((e) => e.timestamp)).toEqual([recent.timestamp]);
  });
});

describe('user predictions', () => {
  function mkPrediction(id: string): UserPrediction {
    return {
      id,
      symbol: 'BTC',
      targetPrice: 100_000,
      direction: 'above',
      marketProbAtTime: 50,
      createdAt: 0,
    };
  }

  it('returns an empty array when not set', async () => {
    expect(await getUserPredictions()).toEqual([]);
  });

  it('adds a prediction', async () => {
    await addUserPrediction(mkPrediction('p1'));
    await addUserPrediction(mkPrediction('p2'));
    const got = await getUserPredictions();
    expect(got.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('removes a prediction by id', async () => {
    await addUserPrediction(mkPrediction('p1'));
    await addUserPrediction(mkPrediction('p2'));
    await removeUserPrediction('p1');
    const got = await getUserPredictions();
    expect(got.map((p) => p.id)).toEqual(['p2']);
  });

  it('removing a nonexistent id is a no-op', async () => {
    await addUserPrediction(mkPrediction('p1'));
    await removeUserPrediction('nope');
    expect((await getUserPredictions()).map((p) => p.id)).toEqual(['p1']);
  });
});
