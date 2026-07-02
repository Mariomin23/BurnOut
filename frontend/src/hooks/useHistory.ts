import { useCallback, useState } from 'react';
import type { ExerciseHistorySummary, WorkoutLog, WorkoutRoutine } from '../types';
import { HISTORY_KEY, appendToHistory, buildWorkoutLog, summarizeHistory } from '../lib/history';

export function useHistory() {
  const [history, setHistory] = useState<WorkoutLog[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const appendWorkout = useCallback((routine: WorkoutRoutine) => {
    const log = buildWorkoutLog(routine, new Date().toISOString());
    if (!log) return;
    setHistory(prev => {
      const next = appendToHistory(prev, log);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const buildSummary = useCallback(
    (): ExerciseHistorySummary[] => summarizeHistory(history),
    [history]
  );

  return { history, appendWorkout, buildSummary };
}
