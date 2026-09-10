import { Lot } from '../data/demoLots';
import { ComponentDetails } from '../data/demoComponents';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  getLots: async (): Promise<Lot[]> => {
    const res = await fetch(`${API_BASE}/lots`);
    if (!res.ok) throw new Error("Failed to fetch lots");
    const data = await res.json();
    return data.lots.map((l: any) => ({
      id: l.lotId,
      componentType: l.componentType,
      totalComponents: l.totalComponents,
      checkpoint: '168h',
      anomalyRate: l.anomalyRate,
      anomaliesCount: l.anomalyCount,
      highRiskCount: l.highCount,
      criticalRiskCount: l.criticalCount,
      status: 'ANALYZED'
    }));
  },

  getLot: async (lotId: string): Promise<Lot | undefined> => {
    const lots = await api.getLots();
    return lots.find(l => l.id === lotId);
  },

  getComponents: async (lotId: string): Promise<ComponentDetails[]> => {
    const res = await fetch(`${API_BASE}/lots/${lotId}/components`);
    if (!res.ok) throw new Error("Failed to fetch components");
    const data = await res.json();
    return data.components.map((c: any) => ({
      id: c.componentId,
      lotId: lotId,
      type: 'Unknown',
      absoluteSpec: 'PASS',
      lotRelativeBehaviour: c.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
      zScore: c.lotZScore || 0,
      anomalyScore: c.isAnomalous ? (c.severity === 'Critical' ? 0.95 : 0.75) : 0.1,
      drift: c.drift_168h || 0,
      predicted168h: 4.0,
      risk: c.severity === 'None' || !c.severity ? 'LOW' : c.severity.toUpperCase(),
      status: c.failureMode || 'Normal'
    })).sort((a: any, b: any) => b.anomalyScore - a.anomalyScore);
  },

  getComponent: async (compId: string, lotId: string): Promise<ComponentDetails | undefined> => {
    try {
      const res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) throw new Error("Failed to fetch component");
      const c = await res.json();
      return {
        id: c.componentId,
        lotId: c.lotId,
        type: c.componentType,
        absoluteSpec: 'PASS',
        lotRelativeBehaviour: c.status.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
        zScore: c.status.lotZScore || 0,
        anomalyScore: c.status.isAnomalous ? (c.status.severity === 'Critical' ? 0.95 : 0.75) : 0.1,
        drift: 0,
        predicted168h: 4.0,
        risk: c.status.severity === 'None' || !c.status.severity ? 'LOW' : c.status.severity.toUpperCase(),
        status: c.status.failureMode || 'Normal'
      };
    } catch {
      return undefined;
    }
  },

  getTrajectory: async (compId: string, lotId: string) => {
    try {
      const res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) throw new Error("Failed to fetch trajectory");
      const data = await res.json();
      
      // The backend returns a simple array of {checkpoint, value}. 
      // The frontend UI expects {time, value, predictedValue, safetyBoundary}.
      // Let's map it so the chart still renders nicely:
      return data.trajectory.map((t: any, index: number) => {
        const timeVal = parseInt(t.checkpoint.replace('h', ''));
        const isPredicted = timeVal > 96; // Just an example logic for visualization
        
        return {
          time: t.checkpoint,
          value: isPredicted ? null : t.value,
          predictedValue: isPredicted ? t.value : null,
          safetyBoundary: 5.0 // Example static safety boundary
        };
      });
    } catch {
      return [];
    }
  },
  
  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error("Failed to upload dataset");
    return await res.json();
  }
};
