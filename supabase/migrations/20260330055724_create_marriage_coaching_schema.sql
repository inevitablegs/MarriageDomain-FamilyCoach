/*
  # Marriage Coaching Platform Database Schema

  ## Overview
  Complete database schema for a marriage coaching platform with pre-marriage and post-marriage services.

  ## New Tables
  
  ### 1. `profiles`
  User profile information extending Supabase auth
  - `id` (uuid, FK to auth.users)
  - `full_name` (text)
  - `email` (text)
  - `relationship_status` (text: single, engaged, married)
  - `partner_id` (uuid, nullable, FK to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `compatibility_assessments`
  Stores compatibility quiz results
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `assessment_type` (text: basic, advanced)
  - `values_score` (integer)
  - `lifestyle_score` (integer)
  - `communication_score` (integer)
  - `total_score` (integer)
  - `responses` (jsonb)
  - `completed_at` (timestamptz)

  ### 3. `red_flags`
  Detected red flags and warnings
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `category` (text)
  - `severity` (text: high, medium, low)
  - `description` (text)
  - `detected_at` (timestamptz)

  ### 4. `services`
  Available coaching services
  - `id` (uuid, PK)
  - `name` (text)
  - `description` (text)
  - `category` (text: pre_marriage, post_marriage)
  - `price` (decimal)
  - `is_free` (boolean)
  - `features` (jsonb)

  ### 5. `bookings`
  Service bookings and sessions
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `service_id` (uuid, FK)
  - `status` (text: pending, confirmed, completed)
  - `scheduled_at` (timestamptz)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 6. `relationship_health`
  Ongoing relationship health tracking
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `emotional_score` (integer)
  - `communication_score` (integer)
  - `intimacy_score` (integer)
  - `conflict_score` (integer)
  - `overall_score` (integer)
  - `notes` (text)
  - `recorded_at` (timestamptz)

  ### 7. `discussion_sessions`
  Couple discussion toolkit sessions
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `topic` (text)
  - `responses` (jsonb)
  - `completed` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Partner access for shared features
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  relationship_status text NOT NULL DEFAULT 'single',
  partner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create compatibility_assessments table
CREATE TABLE IF NOT EXISTS compatibility_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_type text NOT NULL DEFAULT 'basic',
  values_score integer DEFAULT 0,
  lifestyle_score integer DEFAULT 0,
  communication_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  responses jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE compatibility_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON compatibility_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON compatibility_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create red_flags table
CREATE TABLE IF NOT EXISTS red_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  detected_at timestamptz DEFAULT now()
);

ALTER TABLE red_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own red flags"
  ON red_flags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own red flags"
  ON red_flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price decimal DEFAULT 0,
  is_free boolean DEFAULT false,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create relationship_health table
CREATE TABLE IF NOT EXISTS relationship_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emotional_score integer DEFAULT 0,
  communication_score integer DEFAULT 0,
  intimacy_score integer DEFAULT 0,
  conflict_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  notes text,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE relationship_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health records"
  ON relationship_health FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health records"
  ON relationship_health FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create discussion_sessions table
CREATE TABLE IF NOT EXISTS discussion_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discussion_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discussion sessions"
  ON discussion_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discussion sessions"
  ON discussion_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussion sessions"
  ON discussion_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_compatibility_assessments_user_id ON compatibility_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_red_flags_user_id ON red_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_health_user_id ON relationship_health(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_sessions_user_id ON discussion_sessions(user_id);