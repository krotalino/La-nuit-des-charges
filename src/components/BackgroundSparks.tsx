import React, { useMemo } from 'react';

export const BackgroundSparks: React.FC = () => {
  // Generate random floating sparks
  const sparks = useMemo(() => {
    const colors = ['#FF7900', '#FF9433', '#FFB870', '#FFFFFF', '#FFA726'];
    const count = 28;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 3.5 + Math.random() * 2) % 98}%`,
      color: colors[i % colors.length],
      size: 4 + (i % 4) * 1.5,
      duration: 7 + (i % 8) * 1.5,
      delay: -(i * 0.7),
      blur: i % 3 === 0 ? '1px' : '0px',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="sparkle"
          style={{
            left: spark.left,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            backgroundColor: spark.color,
            animationDuration: `${spark.duration}s`,
            animationDelay: `${spark.delay}s`,
            filter: `blur(${spark.blur})`,
            boxShadow: `0 0 8px ${spark.color}`,
          }}
        />
      ))}
    </div>
  );
};
