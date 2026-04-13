import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PriceBracket } from '../types/market';
import { BracketSnapshot } from '../types/storage';
import {
  getAlertBaselines,
  saveAlertBaselines,
  getAlertSettings,
} from './storageService';
import { bracketToSnapshot } from '../utils/digestAnalytics';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shift-alerts', {
      name: 'Probability Shift Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function checkAndNotifyShifts(
  symbol: string,
  currentBrackets: PriceBracket[],
): Promise<void> {
  const settings = await getAlertSettings();
  if (!settings.enabled) return;

  const baselines = await getAlertBaselines();
  const oldBrackets = baselines?.symbols[symbol] ?? [];

  if (oldBrackets.length === 0) return;

  const oldMap = new Map(oldBrackets.map((b) => [b.displayRange, b.probability]));
  const threshold = settings.thresholdPercent;

  for (const bracket of currentBrackets) {
    const oldProb = oldMap.get(bracket.displayRange);
    if (oldProb == null) continue;

    const delta = bracket.probability - oldProb;
    if (Math.abs(delta) >= threshold) {
      const arrow = delta > 0 ? '\u2191' : '\u2193';
      const body = `${symbol} ${bracket.displayRange} shifted from ${oldProb}% to ${bracket.probability}% ${arrow}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${symbol} Probability Shift`,
          body,
          data: { symbol, range: bracket.displayRange },
        },
        trigger: null, // Fire immediately
      });
    }
  }
}

export async function updateBaselines(
  symbol: string,
  currentBrackets: PriceBracket[],
): Promise<void> {
  const baselines = await getAlertBaselines() ?? { symbols: {}, timestamp: 0 };
  baselines.symbols[symbol] = currentBrackets.map(bracketToSnapshot);
  baselines.timestamp = Date.now();
  await saveAlertBaselines(baselines);
}
