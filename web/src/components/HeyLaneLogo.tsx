import React from 'react';

interface HeyLaneLogoProps {
  variant?: 'master' | 'symbol';
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const HeyLaneLogo: React.FC<HeyLaneLogoProps> = ({
  variant = 'master',
  height = 36,
  className = '',
  style,
}) => {
  const src = variant === 'symbol' 
    ? '/assets/brand/HeyLane-Symbol.svg' 
    : '/assets/brand/HeyLane-Master.svg';

  return (
    <img
      src={src}
      alt="HeyLane"
      className={className}
      style={{
        height,
        width: 'auto',
        display: 'block',
        ...style,
      }}
      onError={(e) => {
        // Fallback to relative path if hosted under sub-paths
        (e.target as HTMLImageElement).src = variant === 'symbol'
          ? './assets/brand/HeyLane-Symbol.svg'
          : './assets/brand/HeyLane-Master.svg';
      }}
    />
  );
};

