-- ============================================================================
-- CRIP MOSFET Burn-In Screening Platform - Supabase Postgres Schema
-- Note: gen_random_uuid() is natively built into PostgreSQL 13+ (no extensions required)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table: lots
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code TEXT NOT NULL UNIQUE,
    component_type TEXT NOT NULL DEFAULT 'IRF540N Power MOSFET',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Table: components
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    component_external_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_lot_component UNIQUE (lot_id, component_external_id)
);

-- ----------------------------------------------------------------------------
-- 3. Table: component_measurements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS component_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    test_hour INTEGER NOT NULL,
    stress_temp_c DOUBLE PRECISION NOT NULL DEFAULT 125.0,
    stress_vds_v DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    gate_drive_v DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    vth_v DOUBLE PRECISION NOT NULL,
    rds_on_mohm DOUBLE PRECISION NOT NULL,
    idss_leakage_ua DOUBLE PRECISION NOT NULL,
    drain_current_a DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_component_test_hour UNIQUE (component_id, test_hour)
);

-- ----------------------------------------------------------------------------
-- 4. Table: model_runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type TEXT NOT NULL CHECK (run_type IN ('batch_upload', 'single_component_test')),
    source_filename TEXT,
    triggered_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Table: anomaly_results
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anomaly_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    anomaly_risk_score DOUBLE PRECISION NOT NULL,
    anomaly_threshold DOUBLE PRECISION NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. Table: drift_predictions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drift_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    future_failure_probability DOUBLE PRECISION NOT NULL,
    future_failure_threshold DOUBLE PRECISION NOT NULL,
    predicted_future_failure BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. Table: risk_assessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    main_reason TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Indexes for High Performance Queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_components_lot_id ON components(lot_id);
CREATE INDEX IF NOT EXISTS idx_components_external_id ON components(component_external_id);
CREATE INDEX IF NOT EXISTS idx_measurements_component_hour ON component_measurements(component_id, test_hour);
CREATE INDEX IF NOT EXISTS idx_model_runs_created_at ON model_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_run_id ON anomaly_results(model_run_id);
CREATE INDEX IF NOT EXISTS idx_drift_run_id ON drift_predictions(model_run_id);
CREATE INDEX IF NOT EXISTS idx_risk_run_id ON risk_assessments(model_run_id);
CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_assessments(risk_level);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated & anon team development access
DROP POLICY IF EXISTS "Allow public read-write on lots" ON lots;
CREATE POLICY "Allow public read-write on lots" ON lots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on components" ON components;
CREATE POLICY "Allow public read-write on components" ON components FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on component_measurements" ON component_measurements;
CREATE POLICY "Allow public read-write on component_measurements" ON component_measurements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on model_runs" ON model_runs;
CREATE POLICY "Allow public read-write on model_runs" ON model_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on anomaly_results" ON anomaly_results;
CREATE POLICY "Allow public read-write on anomaly_results" ON anomaly_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on drift_predictions" ON drift_predictions;
CREATE POLICY "Allow public read-write on drift_predictions" ON drift_predictions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write on risk_assessments" ON risk_assessments;
CREATE POLICY "Allow public read-write on risk_assessments" ON risk_assessments FOR ALL USING (true) WITH CHECK (true);
