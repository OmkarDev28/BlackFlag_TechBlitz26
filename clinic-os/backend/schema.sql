-- ====================================================
-- Clinic OS - Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ====================================================

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role;

-- 2. Create custom role enum
CREATE TYPE user_role AS ENUM ('doctor', 'receptionist');

-- 3. Users table (doctors and receptionists)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  medical_history TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_end_before_start CHECK (end_time > start_time)
);

-- 6. Index for fast clash detection queries
CREATE INDEX idx_appointments_doctor_time ON appointments(doctor_id, start_time, end_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- ====================================================
-- SEED DATA (optional - for testing)
-- Replace password_hashes with bcrypt hashes of your passwords
-- Default test passwords: doctor123 / receptionist123
-- ====================================================

-- Sample users (password: TestPass123)
-- To generate hashes, use: node -e "const b=require('bcryptjs');b.hash('TestPass123',10).then(console.log)"
