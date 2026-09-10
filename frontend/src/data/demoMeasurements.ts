export interface TrajectoryPoint {
  time: string;
  timeNumeric: number;
  value: number | null;
  predictedValue: number | null;
  lotAverage: number;
  upperNormal: number;
  lowerNormal: number;
  safetyBoundary: number;
}

export function getComponentTrajectory(compId: string, lotId: string): TrajectoryPoint[] {
  // Hero component specific trajectory
  if (compId === 'CMP-0427' && lotId === 'LOT_2026_00') {
    return [
      {
        time: '0h',
        timeNumeric: 0,
        value: 4.05,
        predictedValue: null,
        lotAverage: 4.01,
        upperNormal: 4.15,
        lowerNormal: 3.85,
        safetyBoundary: 4.90,
      },
      {
        time: '24h',
        timeNumeric: 24,
        value: 4.15,
        predictedValue: null,
        lotAverage: 4.02,
        upperNormal: 4.16,
        lowerNormal: 3.86,
        safetyBoundary: 4.90,
      },
      {
        time: '96h',
        timeNumeric: 96,
        value: 4.45, // Accelerating drift
        predictedValue: null,
        lotAverage: 4.03,
        upperNormal: 4.18,
        lowerNormal: 3.88,
        safetyBoundary: 4.90,
      },
      {
        time: '168h',
        timeNumeric: 168,
        value: 4.78, // High, outside lot normal but still < 4.90 absolute spec
        predictedValue: 4.82, // Model prediction line continues
        lotAverage: 4.05,
        upperNormal: 4.20,
        lowerNormal: 3.90,
        safetyBoundary: 4.90,
      }
    ];
  }

  // Generic normal component trajectory
  return [
    { time: '0h', timeNumeric: 0, value: 4.0, predictedValue: null, lotAverage: 4.01, upperNormal: 4.15, lowerNormal: 3.85, safetyBoundary: 4.90 },
    { time: '24h', timeNumeric: 24, value: 4.02, predictedValue: null, lotAverage: 4.02, upperNormal: 4.16, lowerNormal: 3.86, safetyBoundary: 4.90 },
    { time: '96h', timeNumeric: 96, value: 4.04, predictedValue: null, lotAverage: 4.03, upperNormal: 4.18, lowerNormal: 3.88, safetyBoundary: 4.90 },
    { time: '168h', timeNumeric: 168, value: 4.06, predictedValue: 4.06, lotAverage: 4.05, upperNormal: 4.20, lowerNormal: 3.90, safetyBoundary: 4.90 },
  ];
}
