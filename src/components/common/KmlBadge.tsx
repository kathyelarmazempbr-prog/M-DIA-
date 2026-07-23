import React from 'react';
import { useApp } from '../../context/AppContext';

interface KmlBadgeProps {
  kml: number;
  showUnit?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const KmlBadge: React.FC<KmlBadgeProps> = ({
  kml,
  showUnit = true,
  size = 'md',
  showLabel = false,
}) => {
  const { getPerformanceColor, getPerformanceLevel } = useApp();
  const colors = getPerformanceColor(kml);
  const level = getPerformanceLevel(kml);

  let sizeClasses = 'px-2.5 py-1 text-sm font-semibold';
  if (size === 'sm') sizeClasses = 'px-2 py-0.5 text-xs font-medium';
  if (size === 'lg') sizeClasses = 'px-3.5 py-1.5 text-base font-bold';

  let statusText = 'Excelente';
  if (level === 'regular') statusText = 'Regular';
  if (level === 'low') statusText = 'Abaixo';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-all ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
      title={`Consumo: ${kml.toFixed(2)} km/l - Status: ${statusText}`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.badge} animate-pulse`} />
      <span>
        {kml.toFixed(2)}
        {showUnit && <span className="ml-1 text-[0.8em] font-normal opacity-90">km/l</span>}
      </span>
      {showLabel && (
        <span className="ml-1 border-l pl-1.5 text-[0.85em] font-medium opacity-85 border-current">
          {statusText}
        </span>
      )}
    </span>
  );
};
