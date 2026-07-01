import React, { useEffect, useState } from 'react';

interface RestTimerProps {
  initialSeconds: number;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSeconds, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      playChime();
      setIsActive(false);
      // Wait 1.5 seconds and close automatically or stay
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.warn('Web Audio API not supported or blocked by user gesture', err);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const skipTimer = () => onClose();
  const addTime = () => setSecondsLeft((prev) => prev + 15);
  const subtractTime = () => setSecondsLeft((prev) => Math.max(0, prev - 15));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = (secondsLeft / initialSeconds) * 100;

  return (
    <div 
      className="glass pulse-neon" 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '400px',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), var(--shadow-neon)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Simple Progress Ring */}
        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '50px', height: '50px' }}>
            <circle 
              cx="25" 
              cy="25" 
              r="20" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="4" 
              fill="transparent" 
            />
            <circle 
              cx="25" 
              cy="25" 
              r="20" 
              stroke={secondsLeft === 0 ? "var(--color-danger)" : "var(--color-primary)"}
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="125.6"
              strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '0.75rem',
              fontWeight: '700',
              fontFamily: 'var(--font-heading)',
              color: secondsLeft === 0 ? 'var(--color-danger)' : 'white'
            }}
          >
            ⏱️
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {secondsLeft === 0 ? '¡Tiempo completado!' : 'Descanso'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: '1.15' }}>
            {formatTime(secondsLeft)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button 
          onClick={subtractTime} 
          className="btn btn-secondary btn-circle" 
          style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
          title="-15s"
        >
          -15
        </button>
        <button 
          onClick={addTime} 
          className="btn btn-secondary btn-circle" 
          style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
          title="+15s"
        >
          +15
        </button>
        <button 
          onClick={toggleTimer} 
          className="btn btn-primary btn-circle" 
          style={{ 
            width: '38px', 
            height: '38px',
            background: secondsLeft === 0 ? 'var(--color-danger)' : 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))' 
          }}
        >
          {isActive ? '⏸️' : '▶️'}
        </button>
        <button 
          onClick={skipTimer} 
          className="btn btn-danger btn-circle" 
          style={{ width: '38px', height: '38px' }}
          title="Saltar"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
