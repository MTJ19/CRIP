"use client";

import React from 'react';

// Exact mathematically calibrated gears for seamless interlocking meshing
const GEAR_1_PATH =
  "M 22.00,0.00 L 21.78,3.10 L 30.99,7.96 L 27.54,16.29 L 17.59,13.21 L 15.56,15.56 L 15.56,15.56 L 13.21,17.59 L 16.29,27.54 L 7.96,30.99 L 3.10,21.78 L 0.00,22.00 L 0.00,22.00 L -3.10,21.78 L -7.96,30.99 L -16.29,27.54 L -13.21,17.59 L -15.56,15.56 L -15.56,15.56 L -17.59,13.21 L -27.54,16.29 L -30.99,7.96 L -21.78,3.10 L -22.00,0.00 L -22.00,0.00 L -21.78,-3.10 L -30.99,-7.96 L -27.54,-16.29 L -17.59,-13.21 L -15.56,-15.56 L -15.56,-15.56 L -13.21,-17.59 L -16.29,-27.54 L -7.96,-30.99 L -3.10,-21.78 L -0.00,-22.00 L -0.00,-22.00 L 3.10,-21.78 L 7.96,-30.99 L 16.29,-27.54 L 13.21,-17.59 L 15.56,-15.56 L 15.56,-15.56 L 17.59,-13.21 L 27.54,-16.29 L 30.99,-7.96 L 21.78,-3.10 L 22.00,-0.00 Z M 9.00,0 A 9.00,9.00 0 1 0 -9.00,0 A 9.00,9.00 0 1 0 9.00,0 Z";

const GEAR_2_PATH =
  "M 15.50,0.00 L 15.23,2.90 L 22.19,7.73 L 17.79,15.36 L 10.13,11.73 L 7.75,13.42 L 7.75,13.42 L 5.10,14.64 L 4.40,23.08 L -4.40,23.08 L -5.10,14.64 L -7.75,13.42 L -7.75,13.42 L -10.13,11.73 L -17.79,15.36 L -22.19,7.73 L -15.23,2.90 L -15.50,0.00 L -15.50,0.00 L -15.23,-2.90 L -22.19,-7.73 L -17.79,-15.36 L -10.13,-11.73 L -7.75,-13.42 L -7.75,-13.42 L -5.10,-14.64 L -4.40,-23.08 L 4.40,-23.08 L 5.10,-14.64 L 7.75,-13.42 L 7.75,-13.42 L 10.13,-11.73 L 17.79,-15.36 L 22.19,-7.73 L 15.23,-2.90 L 15.50,-0.00 Z M 6.50,0 A 6.50,6.50 0 1 0 -6.50,0 A 6.50,6.50 0 1 0 6.50,0 Z";

interface TwoGearsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TwoRotatingGears: React.FC<TwoGearsProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-16 h-14',
    md: 'w-24 h-20',
    lg: 'w-32 h-28',
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeMap[size] || sizeMap.md} ${className}`}>
      <svg
        viewBox="0 0 115 102"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="gear-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Big Gear 1 (Upper-Left) - Rotates Clockwise */}
        <g transform="translate(38, 38)">
          <g className="animate-gear-main origin-center" style={{ transformOrigin: '0px 0px' }}>
            <path
              d={GEAR_1_PATH}
              fill="#94a3b8"
              fillRule="evenodd"
              className="transition-colors drop-shadow-md hover:fill-slate-300"
              filter="url(#gear-shadow)"
            />
          </g>
        </g>

        {/* Small Gear 2 (Lower-Right) - Rotates Counter-Clockwise in Mesh */}
        <g transform="translate(76.8, 66.2)">
          <g className="animate-gear-sub origin-center" style={{ transformOrigin: '0px 0px' }}>
            <path
              d={GEAR_2_PATH}
              fill="#94a3b8"
              fillRule="evenodd"
              className="transition-colors drop-shadow-md hover:fill-slate-300"
              filter="url(#gear-shadow)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

interface IndustrialLoaderProps {
  message?: string;
  minHeight?: string;
  className?: string;
  gearSize?: 'sm' | 'md' | 'lg';
}

export const IndustrialLoader: React.FC<IndustrialLoaderProps> = ({
  message = 'Loading active screening analysis...',
  minHeight = 'min-h-[60vh]',
  className = '',
  gearSize = 'md',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} space-y-4 font-mono text-xs text-slate-400 select-none ${className}`}>
      <TwoRotatingGears size={gearSize} />
      <div>{message}</div>
    </div>
  );
};

export default IndustrialLoader;
