import React from 'react';
import type { ProgressPoint } from '../lib/progress';

interface ProgressChartProps {
  series: ProgressPoint[];
}

const VIEW_W = 320;
const VIEW_H = 150;
const PAD_L = 38;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 26;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

export const ProgressChart: React.FC<ProgressChartProps> = ({ series }) => {
  if (series.length === 0) return null;

  // Ejercicios de autocarga (todo a 0 kg): el progreso se mide en reps
  const weightMode = series.some(p => p.topWeightKg > 0);
  const values = series.map(p => (weightMode ? p.topWeightKg : p.topReps));
  const unit = weightMode ? 'kg' : 'reps';

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin;
  // Margen vertical para que la línea no toque los bordes; escala plana → ±10%
  const yMin = Math.max(0, span === 0 ? rawMin * 0.9 : rawMin - span * 0.15);
  const yMax = span === 0 ? (rawMax === 0 ? 1 : rawMax * 1.1) : rawMax + span * 0.15;

  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = VIEW_H - PAD_T - PAD_B;

  const x = (i: number) =>
    PAD_L + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const linePoints = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPoints = `${PAD_L},${PAD_T + plotH} ${linePoints} ${x(series.length - 1).toFixed(1)},${PAD_T + plotH}`;

  const last = values[values.length - 1];
  const first = values[0];
  const delta = last - first;

  return (
    <div className="progress-chart">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="progress-chart__svg"
        role="img"
        aria-label={`Progreso: de ${first} a ${last} ${unit} en ${series.length} sesiones`}
      >
        <defs>
          <linearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary-bright, #34d399)" />
            <stop offset="100%" stopColor="var(--color-secondary, #38bdf8)" />
          </linearGradient>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.25)" />
            <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
          </linearGradient>
        </defs>

        {/* Líneas de referencia y etiquetas del eje Y */}
        {[yMax, (yMax + yMin) / 2, yMin].map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L} x2={VIEW_W - PAD_R} y1={y(v)} y2={y(v)}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            <text x={PAD_L - 5} y={y(v) + 3} textAnchor="end" className="progress-chart__axis-label">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        ))}

        {series.length > 1 && <polygon points={areaPoints} fill="url(#chart-area)" />}
        {series.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#chart-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {values.map((v, i) => (
          <circle
            key={i}
            cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4 : 3}
            fill={i === values.length - 1 ? 'var(--color-secondary, #38bdf8)' : 'var(--color-primary-bright, #34d399)'}
            stroke="rgba(0,0,0,0.4)" strokeWidth="1"
          />
        ))}

        {/* Fechas de la primera y última sesión */}
        <text x={x(0)} y={VIEW_H - 8} textAnchor={series.length === 1 ? 'middle' : 'start'} className="progress-chart__axis-label">
          {formatDate(series[0].date)}
        </text>
        {series.length > 1 && (
          <text x={x(series.length - 1)} y={VIEW_H - 8} textAnchor="end" className="progress-chart__axis-label">
            {formatDate(series[series.length - 1].date)}
          </text>
        )}
      </svg>

      <div className="progress-chart__footer">
        <span className="progress-chart__current">
          Último: <strong>{last} {unit}</strong>
        </span>
        {series.length > 1 ? (
          <span
            className={`badge-pill ${delta > 0 ? 'progress-chart__delta--up' : delta < 0 ? 'progress-chart__delta--down' : 'progress-chart__delta--flat'}`}
          >
            {delta > 0 ? `▲ +${Number.isInteger(delta) ? delta : delta.toFixed(1)}` : delta < 0 ? `▼ ${Number.isInteger(delta) ? delta : delta.toFixed(1)}` : '= sin cambio'} {delta !== 0 ? unit : ''}
          </span>
        ) : (
          <span className="progress-chart__hint">Completa más sesiones para ver la tendencia</span>
        )}
      </div>
    </div>
  );
};
