import { useState, useCallback } from 'react';

interface StreakData {
  count: number;
  lastWorkoutDate: string;
  /** Mejor racha histórica (para medallas); datos antiguos sin el campo usan count */
  best?: number;
}

const STORAGE_KEY = 'fit_poke_streak_v2';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function readData(): StreakData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStreak(): number {
  const data = readData();
  if (!data) return 0;
  const today = toDateString(new Date());
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = toDateString(d);
  if (data.lastWorkoutDate === today || data.lastWorkoutDate === yesterday) {
    return data.count;
  }
  return 0;
}

function readBestStreak(): number {
  const data = readData();
  if (!data) return 0;
  return Math.max(data.best ?? 0, data.count);
}

export function useStreak() {
  const [streak, setStreak] = useState<number>(readStreak);
  const [bestStreak, setBestStreak] = useState<number>(readBestStreak);

  const recordWorkout = useCallback(() => {
    const today = toDateString(new Date());
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = toDateString(d);

    const data = readData();
    let newCount: number;
    if (!data) {
      newCount = 1;
    } else {
      if (data.lastWorkoutDate === today) return;
      newCount = data.lastWorkoutDate === yesterday ? data.count + 1 : 1;
    }

    const newBest = Math.max(newCount, data?.best ?? 0, data?.count ?? 0);
    const newData: StreakData = { count: newCount, lastWorkoutDate: today, best: newBest };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setStreak(newCount);
    setBestStreak(newBest);
  }, []);

  return { streak, bestStreak, recordWorkout };
}
