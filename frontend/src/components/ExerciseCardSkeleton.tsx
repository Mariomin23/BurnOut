import React from 'react';

export const ExerciseCardSkeleton: React.FC = () => {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="skeleton-shimmer skeleton-line skeleton-line--short" style={{ marginBottom: '0.5rem' }} />
        <div className="skeleton-shimmer skeleton-line skeleton-line--medium" />
      </div>

      {/* Card body */}
      <div style={{ padding: '1.25rem' }}>
        <div className="skeleton-shimmer skeleton-line skeleton-line--full" style={{ marginBottom: '1.25rem' }} />

        {/* Set rows */}
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
            <div className="skeleton-shimmer skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
};
