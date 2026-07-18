-- ============================================================
-- RESPIRA.ID - PostgreSQL Schema (for Supabase)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'expert', 'admin')),
    license_code VARCHAR(50),
    height NUMERIC,
    weight NUMERIC,
    blood_type VARCHAR(5),
    birth_date DATE,
    emergency_contact VARCHAR(100),
    institution VARCHAR(150),
    title_degree VARCHAR(100),
    sip_number VARCHAR(50),
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Checkins Table
CREATE TABLE IF NOT EXISTS daily_checkins (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    check_date DATE DEFAULT CURRENT_DATE
);

-- Diagnosis Logs Table
CREATE TABLE IF NOT EXISTS diagnosis_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    final_result TEXT,
    confidence_score NUMERIC,
    symptoms_summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diagnosis_log_id INT REFERENCES diagnosis_logs(id) ON DELETE SET NULL,
    requested_date TIMESTAMP,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    doctor_response TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- History Table (legacy)
CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diagnosis VARCHAR(255) NOT NULL,
    severity VARCHAR(50),
    date DATE,
    status VARCHAR(50)
);

-- Symptoms Table
CREATE TABLE IF NOT EXISTS symptoms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20) UNIQUE,
    description TEXT
);

-- Diseases Table
CREATE TABLE IF NOT EXISTS diseases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(20) UNIQUE,
    treatment_advice TEXT
);

-- Research Drafts Table
CREATE TABLE IF NOT EXISTS research_drafts (
    id SERIAL PRIMARY KEY,
    expert_id INT REFERENCES users(id) ON DELETE SET NULL,
    content JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    source_journal VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diagnosis Rules Table
CREATE TABLE IF NOT EXISTS diagnosis_rules (
    id SERIAL PRIMARY KEY,
    symptom_combination JSONB,
    disease_code VARCHAR(20),
    confidence FLOAT
);

-- App Config Table (for decision tree storage)
CREATE TABLE IF NOT EXISTS app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Seed Data
-- ============================================================
INSERT INTO users (name, email, password, role, license_code) VALUES 
('Admin Respira', 'admin@respira.id', 'admin123', 'admin', NULL),
('Dr. Sarah Sp.P', 'dokter@respira.id', 'dokter123', 'expert', 'DOKTER123'),
('Budi Santoso', 'user@gmail.com', 'user123', 'patient', NULL)
ON CONFLICT (email) DO NOTHING;
