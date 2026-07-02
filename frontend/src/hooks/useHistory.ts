import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // quota / modo privado: el historial vive solo en memoria esta sesión
    }
  }, [history]);

  const appendWorkout = useCallback((routine: WorkoutRoutine) => {
    const log = buildWorkoutLog(routine, new Date().toISOString());
    if (!log) return;
    setHistory(prev => appendToHistory(prev, log));
  }, []);

  const buildSummary = useCallback(
    (): ExerciseHistorySummary[] => summarizeHistory(history),
    [history]
  );

  return { history, appendWorkout, buildSummary };
}
