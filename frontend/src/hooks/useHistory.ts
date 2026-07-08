import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExerciseHistorySummary, WorkoutLog, WorkoutRoutine } from '../types';
import { HISTORY_KEY, appendToHistory, buildWorkoutLog, mergeHistories, summarizeHistory } from '../lib/history';
import { API_ROOT } from '../lib/api';

export function useHistory(token: string | null = null) {
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

  // Con sesión iniciada: baja el historial del servidor y fusiónalo con el local
  const serverSyncedRef = useRef(false);
  useEffect(() => {
    if (!token) {
      serverSyncedRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_ROOT}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const remote: WorkoutLog[] = Array.isArray(data.logs) ? data.logs : [];
        if (cancelled) return;
        setHistory(prev => mergeHistories(prev, remote));
        serverSyncedRef.current = true;
      } catch {
        // sin conexión: seguimos con el historial local
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Tras la fusión inicial, cada cambio del historial se sube al servidor
  useEffect(() => {
    if (!token || !serverSyncedRef.current) return;
    fetch(`${API_ROOT}/history`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ logs: history }),
    }).catch(() => {
      // sin conexión: el próximo cambio con red volverá a subir todo
    });
  }, [history, token]);

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
