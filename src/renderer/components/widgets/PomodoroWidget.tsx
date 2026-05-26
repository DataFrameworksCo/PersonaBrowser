import React, { useEffect, useMemo, useState } from 'react';
import AppIcon from '../ui/AppIcon';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const formatSeconds = (value: number) => {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PomodoroWidget: React.FC = () => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const cycleLength = mode === 'focus' ? WORK_SECONDS : BREAK_SECONDS;

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft((currentValue) => {
        if (currentValue > 1) return currentValue - 1;
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        return nextMode === 'focus' ? WORK_SECONDS : BREAK_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, running]);

  const progress = useMemo(() => 1 - secondsLeft / cycleLength, [cycleLength, secondsLeft]);

  const resetCycle = (nextMode = mode) => {
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? WORK_SECONDS : BREAK_SECONDS);
    setRunning(false);
  };

  return (
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-panel-row">
          <div>
            <div className="widget-kicker">Flow</div>
            <div className="widget-title">{mode === 'focus' ? 'Focus sprint' : 'Recovery break'}</div>
          </div>
          <span className="widget-pill">
            <AppIcon name="timer" size={12} />
            {mode === 'focus' ? '25/5' : 'Break'}
          </span>
        </div>
      </div>

      <div className="widget-panel" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="widget-progress-ring" style={{ ['--progress' as string]: progress }}>
          <div className="widget-progress-core">
            <div className="widget-progress-label">{mode}</div>
            <div className="widget-progress-time">{formatSeconds(secondsLeft)}</div>
            <div className="widget-subtitle">{running ? 'Timer is running' : 'Ready when you are'}</div>
          </div>
        </div>
      </div>

      <div className="widget-grid-2">
        <button className="widget-button" onClick={() => setRunning((current) => !current)}>
          <AppIcon name={running ? 'x' : 'bolt'} size={14} />
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="widget-button secondary" onClick={() => resetCycle()}>
          Reset
        </button>
        <button className="widget-button secondary" onClick={() => resetCycle('focus')}>
          Focus
        </button>
        <button className="widget-button secondary" onClick={() => resetCycle('break')}>
          Break
        </button>
      </div>
    </div>
  );
};

export default PomodoroWidget;
