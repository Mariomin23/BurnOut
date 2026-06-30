import { useState, useCallback } from 'react';

interface StreakData {
  count: number;
  lastWorkoutDate: string;
}

const STORAGE_KEY = 'fit_poke_streak_v2';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function readStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data: StreakData = JSON.parse(raw);
    const today = toDateString(new Date());
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = toDateString(d);
    if (data.lastWorkoutDate === today || data.lastWorkoutDate === yesterday) {
      return data.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function useStreak() {
  const [streak, setStreak] = useState<number>(readStreak);

  const recordWorkout = useCallback(() => {
    const today = toDateString(new Date());
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = toDateString(d);

    let newCount: number;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        newCount = 1;
      } else {
        const data: StreakData = JSON.parse(raw);
        if (data.lastWorkoutDate === today) return;
        newCount = data.lastWorkoutDate === yesterday ? data.count + 1 : 1;
      }
    } catch {
      newCount = 1;
    }

    const newData: StreakData = { count: newCount, lastWorkoutDate: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setStreak(newCount);
  }, []);

  return { streak, recordWorkout };
}
