import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  relationship_status: 'single' | 'engaged' | 'married';
  partner_id?: string;
  created_at: string;
  updated_at: string;
};

export type CompatibilityAssessment = {
  id: string;
  user_id: string;
  assessment_type: 'basic' | 'advanced';
  values_score: number;
  lifestyle_score: number;
  communication_score: number;
  total_score: number;
  responses: Record<string, unknown>;
  completed_at: string;
};

export type RedFlag = {
  id: string;
  user_id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  detected_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: 'pre_marriage' | 'post_marriage';
  price: number;
  is_free: boolean;
  features: string[];
};

export type Booking = {
  id: string;
  user_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'completed';
  scheduled_at?: string;
  notes?: string;
  created_at: string;
};

export type RelationshipHealth = {
  id: string;
  user_id: string;
  emotional_score: number;
  communication_score: number;
  intimacy_score: number;
  conflict_score: number;
  overall_score: number;
  notes?: string;
  recorded_at: string;
};

export type PartnerInvitation = {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  responded_at?: string | null;
};

export type CoupleAssessmentSession = {
  id: string;
  initiator_id: string;
  partner_a_id: string;
  partner_b_id: string;
  status: 'pending_partner' | 'completed';
  initiated_at: string;
  completed_at?: string | null;
  question_set?: string[];
  report: Record<string, unknown>;
};

export type CoupleAssessmentSubmission = {
  id: string;
  session_id: string;
  user_id: string;
  responses: Record<string, string | string[]>;
  submitted_at: string;
};
