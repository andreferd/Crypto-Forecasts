import { useState, useEffect, useCallback } from 'react';
import { AlertSettings } from '../types/storage';
import { getAlertSettings, saveAlertSettings } from '../services/storageService';
import { requestNotificationPermissions } from '../services/notificationService';

export function useAlertSettings() {
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: false,
    thresholdPercent: 5,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAlertSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const toggleEnabled = useCallback(async () => {
    const newEnabled = !settings.enabled;

    if (newEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }

    const updated = { ...settings, enabled: newEnabled };
    setSettings(updated);
    await saveAlertSettings(updated);
  }, [settings]);

  const setThreshold = useCallback(
    async (thresholdPercent: number) => {
      const updated = { ...settings, thresholdPercent };
      setSettings(updated);
      await saveAlertSettings(updated);
    },
    [settings],
  );

  return { settings, loaded, toggleEnabled, setThreshold };
}
