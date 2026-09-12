"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, AnalysisRecord, HistoricalRun } from '@/services/api';

export type DbStatusType = 'connected' | 'saving' | 'saved' | 'error' | 'local_storage';

interface AnalysisContextType {
  currentAnalysis: AnalysisRecord | null;
  analysisId: string | null;
  filename: string;
  isSynthetic: boolean;
  dbStatus: DbStatusType;
  dbStatusMessage: string;
  isLoading: boolean;
  error: string | null;
  analysesList: HistoricalRun[];
  loadAnalysis: (id: string) => Promise<boolean>;
  setAnalysisData: (data: AnalysisRecord) => void;
  refreshAnalysesList: () => Promise<void>;
  setDbStatusState: (status: DbStatusType, message?: string) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_CURRENT_ID = 'sih_current_analysis_id';
const LOCAL_STORAGE_KEY_RUNS = 'sih_cached_analyses_runs';

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusType>('connected');
  const [dbStatusMessage, setDbStatusMessage] = useState<string>('Database Ready');
  const [analysesList, setAnalysesList] = useState<HistoricalRun[]>([]);

  // Check if current dataset is synthetic/demo
  const isSynthetic = useMemo(() => {
    if (!currentAnalysis) return false;
    if (currentAnalysis.is_synthetic) return true;
    const fn = (currentAnalysis.filename || '').toLowerCase();
    const id = (currentAnalysis.analysis_id || '').toLowerCase();
    return fn.includes('sample') || fn.includes('synthetic') || fn.includes('demo') || id.includes('initial') || id.includes('demo');
  }, [currentAnalysis]);

  const filename = currentAnalysis?.filename || 'No Active Dataset';

  // Check backend DB status
  const checkDb = useCallback(async () => {
    const health = await api.checkDatabaseHealth();
    setDbStatus(health.status as DbStatusType);
    setDbStatusMessage(health.storageType);
  }, []);

  // Refresh historical runs
  const refreshAnalysesList = useCallback(async () => {
    try {
      const runs = await api.getHistoricalRuns();
      if (runs.length > 0) {
        setAnalysesList(runs);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY_RUNS, JSON.stringify(runs));
        }
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY_RUNS);
        if (cached) {
          try {
            setAnalysesList(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn("Could not refresh analyses list:", err);
    }
  }, []);

  // Load a specific analysis by ID without rerunning ML
  const loadAnalysis = useCallback(async (targetId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAnalysis(targetId);
      setCurrentAnalysis(data);
      setAnalysisId(data.analysis_id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_ID, data.analysis_id);
      }
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      console.error("Failed to load analysis:", err);
      const msg = err instanceof Error ? err.message : 'Analysis record not found';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Set analysis data after upload or run
  const setAnalysisData = useCallback((data: AnalysisRecord) => {
    setCurrentAnalysis(data);
    setAnalysisId(data.analysis_id);
    setError(null);
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_ID, data.analysis_id);
    }
    // Prepend to analyses list
    const newRun: HistoricalRun = {
      id: data.analysis_id,
      analysis_id: data.analysis_id,
      run_type: 'batch_upload',
      source_filename: data.filename,
      triggered_by: 'QA Engineer',
      created_at: data.created_at || new Date().toISOString(),
      total_components: data.summary.total_components,
      total_lots: data.lot_breakdown?.length || 1,
      anomalies_count: data.summary.total_anomalies,
      critical_risk_count: data.summary.critical_risk_count,
      high_risk_count: data.summary.high_risk_count,
      status: 'Completed'
    };
    setAnalysesList(prev => [newRun, ...prev.filter(r => r.id !== data.analysis_id)]);
  }, []);

  const setDbStatusState = useCallback((status: DbStatusType, message?: string) => {
    setDbStatus(status);
    if (message) setDbStatusMessage(message);
  }, []);

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setAnalysisId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_ID);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      await checkDb();
      await refreshAnalysesList();

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlAnalysisId = urlParams?.get('analysis_id');
      const storedId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_ID) : null;
      const target = urlAnalysisId || storedId || 'latest';

      if (isMounted) {
        try {
          await loadAnalysis(target);
        } catch {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    initialize();
    return () => { isMounted = false; };
  }, [checkDb, refreshAnalysesList, loadAnalysis]);

  const value = useMemo(() => ({
    currentAnalysis,
    analysisId,
    filename,
    isSynthetic,
    dbStatus,
    dbStatusMessage,
    isLoading,
    error,
    analysesList,
    loadAnalysis,
    setAnalysisData,
    refreshAnalysesList,
    setDbStatusState,
    clearAnalysis
  }), [
    currentAnalysis,
    analysisId,
    filename,
    isSynthetic,
    dbStatus,
    dbStatusMessage,
    isLoading,
    error,
    analysesList,
    loadAnalysis,
    setAnalysisData,
    refreshAnalysesList,
    setDbStatusState,
    clearAnalysis
  ]);

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
