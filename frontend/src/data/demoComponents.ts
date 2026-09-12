export interface ComponentDetails {
  id: string;
  lotId: string;
  type: string;
  absoluteSpec: 'PASS' | 'FAIL';
  lotRelativeBehaviour: 'NORMAL' | 'ANOMALOUS';
  zScore: number;
  anomalyScore: number;
  drift: number; // percentage
  predicted168h: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  reasons?: string;
}

export function getDemoComponentsForLot(lotId: string): ComponentDetails[] {
  const components: ComponentDetails[] = [];
  
  // Seed a random number generator for deterministic mock data
  const seed = lotId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  // Generate 500 components
  for (let i = 1; i <= 500; i++) {
    const idNum = i.toString().padStart(4, '0');
    const compId = `CMP-${idNum}`;
    
    // Inject the hero component
    if (lotId === 'LOT_2026_00' && compId === 'CMP-0427') {
      components.push({
        id: compId,
        lotId,
        type: 'MOSFET_N_CH',
        absoluteSpec: 'PASS',
        lotRelativeBehaviour: 'ANOMALOUS',
        zScore: 3.75,
        anomalyScore: 0.91,
        drift: 18.4,
        predicted168h: 4.82,
        risk: 'HIGH',
        status: 'Recommended for inspection'
      });
      continue;
    }

    const randVal = random();
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let behaviour: 'NORMAL' | 'ANOMALOUS' = 'NORMAL';
    let zScore = (random() * 1.5) - 0.75;
    let anomalyScore = random() * 0.2;
    let drift = (random() * 5) - 2.5;

    if (randVal > 0.95) {
      risk = 'CRITICAL';
      behaviour = 'ANOMALOUS';
      zScore = 4 + random() * 2;
      anomalyScore = 0.8 + random() * 0.2;
      drift = 20 + random() * 10;
    } else if (randVal > 0.90) {
      risk = 'HIGH';
      behaviour = 'ANOMALOUS';
      zScore = 3 + random();
      anomalyScore = 0.6 + random() * 0.2;
      drift = 10 + random() * 10;
    } else if (randVal > 0.80) {
      risk = 'MEDIUM';
      behaviour = 'NORMAL'; // might just be noisy
      zScore = 2 + random();
      anomalyScore = 0.4 + random() * 0.2;
      drift = 5 + random() * 5;
    }

    components.push({
      id: compId,
      lotId,
      type: lotId === 'LOT_2026_00' || lotId === 'LOT_2026_01' ? 'MOSFET_N_CH' : 'GENERIC_COMP',
      absoluteSpec: 'PASS',
      lotRelativeBehaviour: behaviour,
      zScore: parseFloat(zScore.toFixed(2)),
      anomalyScore: parseFloat(anomalyScore.toFixed(2)),
      drift: parseFloat(drift.toFixed(1)),
      predicted168h: parseFloat((4.0 + (drift / 10)).toFixed(2)),
      risk,
      status: risk === 'LOW' ? 'Active' : risk === 'MEDIUM' ? 'Monitor' : 'Recommended for inspection'
    });
  }

  return components.sort((a, b) => b.anomalyScore - a.anomalyScore);
}
