import React from 'react';

export function RoboticArmIcon({ className = '', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <img
      src="/crip-arm.png"
      alt="CRIP Logo"
      className={`object-contain inline-block align-middle ${className}`}
    />
  );
}
