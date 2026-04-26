const mockPlatformState = { OS: 'ios' as 'ios' | 'android' };

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock('react-native', () => ({
  Platform: mockPlatformState,
}));

jest.mock('./storageService', () => ({
  getAlertBaselines: jest.fn(),
  saveAlertBaselines: jest.fn(),
  getAlertSettings: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  checkAndNotifyShifts,
  updateBaselines,
} from './notificationService';
import {
  getAlertBaselines,
  saveAlertBaselines,
  getAlertSettings,
} from './storageService';
import { PriceBracket } from '../types/market';

const mockedNotifs = Notifications as jest.Mocked<typeof Notifications>;
const mockedSettings = getAlertSettings as jest.MockedFunction<typeof getAlertSettings>;
const mockedGetBaselines = getAlertBaselines as jest.MockedFunction<typeof getAlertBaselines>;
const mockedSaveBaselines = saveAlertBaselines as jest.MockedFunction<typeof saveAlertBaselines>;

function bracket(partial: Partial<PriceBracket>): PriceBracket {
  return {
    ticker: 'T',
    label: 'L',
    floorStrike: null,
    capStrike: null,
    probability: 0,
    displayRange: '',
    volume: 0,
    openInterest: 0,
    ...partial,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPlatformState.OS = 'ios';
});

describe('checkAndNotifyShifts', () => {
  it('does nothing when alerts are disabled', async () => {
    mockedSettings.mockResolvedValue({ enabled: false, thresholdPercent: 5 });
    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 80 })]);
    expect(mockedGetBaselines).not.toHaveBeenCalled();
    expect(mockedNotifs.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does nothing when there is no baseline for the symbol', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 5 });
    mockedGetBaselines.mockResolvedValue({ symbols: {}, timestamp: 0 });
    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 80 })]);
    expect(mockedNotifs.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('ignores brackets whose displayRange is not in the baseline', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 5 });
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        BTC: [
          { ticker: 'X', displayRange: 'OLD', probability: 40, floorStrike: null, capStrike: null },
        ],
      },
      timestamp: 0,
    });
    await checkAndNotifyShifts('BTC', [
      bracket({ displayRange: 'NEW', probability: 99 }),
    ]);
    expect(mockedNotifs.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not notify when delta is below the threshold', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 10 });
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        BTC: [
          { ticker: 'X', displayRange: 'R', probability: 40, floorStrike: null, capStrike: null },
        ],
      },
      timestamp: 0,
    });
    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 45 })]);
    expect(mockedNotifs.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('notifies with ↑ when probability rose past the threshold', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 5 });
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        BTC: [
          { ticker: 'X', displayRange: 'R', probability: 40, floorStrike: null, capStrike: null },
        ],
      },
      timestamp: 0,
    });

    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 50 })]);

    expect(mockedNotifs.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const call = mockedNotifs.scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.title).toBe('BTC Probability Shift');
    expect(call.content.body).toContain('40% to 50%');
    expect(call.content.body).toContain('\u2191'); // up arrow
    expect(call.trigger).toBeNull();
  });

  it('notifies with ↓ when probability dropped past the threshold', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 5 });
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        BTC: [
          { ticker: 'X', displayRange: 'R', probability: 60, floorStrike: null, capStrike: null },
        ],
      },
      timestamp: 0,
    });

    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 40 })]);

    const call = mockedNotifs.scheduleNotificationAsync.mock.calls[0][0];
    expect(call.content.body).toContain('\u2193'); // down arrow
    expect(call.content.body).toContain('60% to 40%');
  });

  it('threshold is inclusive (equal to threshold triggers)', async () => {
    mockedSettings.mockResolvedValue({ enabled: true, thresholdPercent: 5 });
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        BTC: [
          { ticker: 'X', displayRange: 'R', probability: 40, floorStrike: null, capStrike: null },
        ],
      },
      timestamp: 0,
    });
    await checkAndNotifyShifts('BTC', [bracket({ displayRange: 'R', probability: 45 })]);
    expect(mockedNotifs.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});

describe('updateBaselines', () => {
  it('creates a new baseline when none exists', async () => {
    mockedGetBaselines.mockResolvedValue(null);
    jest.spyOn(Date, 'now').mockReturnValue(42);

    await updateBaselines('BTC', [
      bracket({ ticker: 'A', displayRange: 'R', probability: 30, floorStrike: 0, capStrike: 100 }),
    ]);

    expect(mockedSaveBaselines).toHaveBeenCalledWith({
      symbols: {
        BTC: [{ ticker: 'A', displayRange: 'R', probability: 30, floorStrike: 0, capStrike: 100 }],
      },
      timestamp: 42,
    });
  });

  it('updates an existing baseline by replacing that symbol', async () => {
    mockedGetBaselines.mockResolvedValue({
      symbols: {
        ETH: [{ ticker: 'E', displayRange: 'r', probability: 10, floorStrike: null, capStrike: null }],
      },
      timestamp: 1,
    });
    jest.spyOn(Date, 'now').mockReturnValue(99);

    await updateBaselines('BTC', [bracket({ ticker: 'A', displayRange: 'R', probability: 30 })]);

    const saved = mockedSaveBaselines.mock.calls[0][0];
    expect(saved.symbols.ETH).toBeDefined(); // untouched
    expect(saved.symbols.BTC).toHaveLength(1);
    expect(saved.timestamp).toBe(99);
  });
});

describe('requestNotificationPermissions', () => {
  it('returns true and does not re-request when already granted', async () => {
    mockedNotifs.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    const ok = await requestNotificationPermissions();
    expect(ok).toBe(true);
    expect(mockedNotifs.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted, returns true on grant', async () => {
    mockedNotifs.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
    mockedNotifs.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    const ok = await requestNotificationPermissions();
    expect(ok).toBe(true);
    expect(mockedNotifs.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('returns false when permission is denied', async () => {
    mockedNotifs.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
    mockedNotifs.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    const ok = await requestNotificationPermissions();
    expect(ok).toBe(false);
  });

  it('creates the Android notification channel when platform is android', async () => {
    mockPlatformState.OS = 'android';
    mockedNotifs.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    await requestNotificationPermissions();
    expect(mockedNotifs.setNotificationChannelAsync).toHaveBeenCalledWith(
      'shift-alerts',
      expect.objectContaining({ name: 'Probability Shift Alerts' }),
    );
  });

  it('skips channel setup on iOS', async () => {
    mockPlatformState.OS = 'ios';
    mockedNotifs.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    await requestNotificationPermissions();
    expect(mockedNotifs.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
