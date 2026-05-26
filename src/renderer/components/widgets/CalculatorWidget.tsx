import React, { useState } from 'react';

const KEYS = [
  '7', '8', '9', '/',
  '4', '5', '6', '*',
  '1', '2', '3', '-',
  '0', '.', '(', ')',
];

const CalculatorWidget: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');

  const evaluateExpression = (input: string) => {
    const sanitized = input.trim();
    if (!sanitized) {
      setResult('0');
      return;
    }

    if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
      setResult('Error');
      return;
    }

    try {
      const nextValue = Function(`"use strict"; return (${sanitized})`)();
      setResult(Number.isFinite(nextValue) ? String(nextValue) : 'Error');
    } catch {
      setResult('Error');
    }
  };

  return (
    <div className="widget-stack">
      <div className="widget-panel">
        <div className="widget-kicker">Quick Math</div>
        <div className="widget-title" style={{ marginTop: 4, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>
          {result}
        </div>
        <div className="widget-subtitle" style={{ marginTop: 6, wordBreak: 'break-all' }}>
          {expression || 'Tap a few keys to calculate inline.'}
        </div>
      </div>

      <div className="widget-keypad">
        {KEYS.map((key) => (
          <button
            key={key}
            className={`widget-key ${/[/*\-()]/.test(key) ? 'operator' : ''}`}
            onClick={() => setExpression((current) => current + key)}
          >
            {key}
          </button>
        ))}
        <button className="widget-key operator" onClick={() => setExpression((current) => current.slice(0, -1))}>
          ⌫
        </button>
        <button className="widget-key operator" onClick={() => setExpression('')}>
          C
        </button>
        <button className="widget-key operator" onClick={() => setExpression((current) => current + '+')}>
          +
        </button>
        <button className="widget-key equals" onClick={() => evaluateExpression(expression)}>
          =
        </button>
      </div>
    </div>
  );
};

export default CalculatorWidget;
