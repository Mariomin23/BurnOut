import { useState, useCallback } from 'react';

export function useRestTimer() {
  const [restDuration, setRestDuration] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  const handleStartRest = useCallback((seconds: number) => {
    setRestDuration(seconds);
    setTimerKey(prev => prev + 1);
  }, []);

  const handleCloseTimer = useCallback(() => {
    setRestDuration(null);
  }, []);

  return { restDuration, timerKey, handleStartRest, handleCloseTimer };
}
