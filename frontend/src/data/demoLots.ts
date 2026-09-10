export interface Lot {
  id: string;
  componentType: string;
  totalComponents: number;
  checkpoint: string;
  anomalyRate: number;
  anomaliesCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  status: 'ANALYZED' | 'PROCESSING' | 'PENDING';
}

export const demoLots: Lot[] = [
  {
    id: 'LOT_2026_00',
    componentType: 'MOSFET_N_CH',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.186,
    anomaliesCount: 93,
    highRiskCount: 31,
    criticalRiskCount: 7,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_01',
    componentType: 'MOSFET_N_CH',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.180,
    anomaliesCount: 90,
    highRiskCount: 28,
    criticalRiskCount: 5,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_02',
    componentType: 'DIODE_SCHOTTKY',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.142,
    anomaliesCount: 71,
    highRiskCount: 15,
    criticalRiskCount: 2,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_03',
    componentType: 'DIODE_SCHOTTKY',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.120,
    anomaliesCount: 60,
    highRiskCount: 12,
    criticalRiskCount: 1,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_04',
    componentType: 'CAP_TANTALUM',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.210,
    anomaliesCount: 105,
    highRiskCount: 40,
    criticalRiskCount: 10,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_05',
    componentType: 'CAP_TANTALUM',
    totalComponents: 500,
    checkpoint: '96h',
    anomalyRate: 0.110,
    anomaliesCount: 55,
    highRiskCount: 15,
    criticalRiskCount: 3,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_06',
    componentType: 'OP_AMP_PRECISION',
    totalComponents: 500,
    checkpoint: '96h',
    anomalyRate: 0.080,
    anomaliesCount: 40,
    highRiskCount: 8,
    criticalRiskCount: 0,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_07',
    componentType: 'ADC_16BIT',
    totalComponents: 500,
    checkpoint: '24h',
    anomalyRate: 0.040,
    anomaliesCount: 20,
    highRiskCount: 2,
    criticalRiskCount: 0,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_08',
    componentType: 'REG_LDO',
    totalComponents: 500,
    checkpoint: '0h',
    anomalyRate: 0.010,
    anomaliesCount: 5,
    highRiskCount: 0,
    criticalRiskCount: 0,
    status: 'ANALYZED'
  },
  {
    id: 'LOT_2026_09',
    componentType: 'FPGA_RAD_HARD',
    totalComponents: 500,
    checkpoint: '168h',
    anomalyRate: 0.020,
    anomaliesCount: 10,
    highRiskCount: 1,
    criticalRiskCount: 0,
    status: 'ANALYZED'
  }
];
