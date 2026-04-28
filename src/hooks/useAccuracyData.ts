import { useState, useEffect, useMemo, useCallback } from 'react';
import { AccuracyLog, AccuracyMetrics, WeeklyReportCard } from '../types/storage';
import { getAccuracyLog } from '../services/storageService';
import { computeAccuracyMetrics, computeWeeklyReports } from '../utils/accuracyAnalytics';
import { ALL_CRYPTO_KEYS } from '../constants/kalshi';

const SYMBOLS = ALL_CRYPTO_KEYS;

export function useAccuracyData() {
  const [log, setLog] = useState<AccuracyLog>({ entries: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAccuracyLog();
    setLog(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo<AccuracyMetrics[]>(
    () => SYMBOLS.map((s) => computeAccuracyMetrics(s, log.entries)),
    [log.entries],
  );

  const weeklyReports = useMemo<WeeklyReportCard[]>(
    () => computeWeeklyReports(log.entries, SYMBOLS),
    [log.entries],
  );

  const hasData = log.entries.length > 0;

  return {
    metrics,
    weeklyReports,
    entries: log.entries,
    hasData,
    loading,
    refresh: loadData,
  };
}
