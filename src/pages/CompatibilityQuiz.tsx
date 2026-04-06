import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle,
  FileText,
  Link2,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Unlink,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  CoupleAssessmentSession,
  CoupleAssessmentSubmission,
  PartnerInvitation,
  Profile,
  supabase,
} from '../lib/supabase';
import {
  AssessmentQuestion,
  Category,
  QUESTION_BANK,
  RiskLevel,
  defaultQuestionSet,
  getQuestionsByIds,
  selectSessionQuestionSet,
} from '../lib/questionBank';
import {
  generateRelationshipAnalysisWithGemini,
  scoreOneLineSimilarityWithGemini,
  SolutionReport
} from '../lib/ai';

type QuizProps = {
  onNavigate: (page: string) => void;
};

type ResponseValue = string | string[];
type Responses = Record<string, ResponseValue>;

type QuestionReport = {
  questionId: string;
  sourceQNo: number;
  category: Category;
  riskLevel: RiskLevel;
  type: AssessmentQuestion['type'];
  match: number;
  confidence: number;
  weight: number;
  questionScore: number;
  maxQuestionScore: number;
};

type FinalReport = {
  strategy: string;
  generated_at: string;
  selected_question_numbers: number[];
  overall_compatibility_percent: number;
  weighted_risk_percent: number;
  category_scores: Record<Category, number>;
  top_risk_contributors: {
    questionId: string;
    sourceQNo: number;
    category: Category;
    riskLevel: RiskLevel;
    riskImpactPercent: number;
  }[];
  score_breakdown: QuestionReport[];
  ai_analysis?: SolutionReport;
};

const categoryList: Category[] = [
  'Communication',
  'Financial',
  'Emotional',
  'Family',
  'Values',
  'Life Goals',
  'Lifestyle',
];

const toPercent = (value: number): number => Math.round(value * 100);

const normalizeWords = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

const localOneLineSimilarity = (a: string, b: string): number => {
  const aSet = new Set(normalizeWords(a));
  const bSet = new Set(normalizeWords(b));
  if (aSet.size === 0 || bSet.size === 0) return 0;

  const intersection = [...aSet].filter((word) => bSet.has(word)).length;
  const union = new Set([...aSet, ...bSet]).size;
  if (union === 0) return 0;

  const ratio = intersection / union;
  if (ratio >= 0.55) return 1;
  if (ratio >= 0.25) return 0.5;
  return 0;
};

const isQuestionAnswered = (question: AssessmentQuestion, value: ResponseValue | undefined): boolean => {
  if (question.type === 'MSQ') {
    return Array.isArray(value) && value.length > 0;
  }
  return typeof value === 'string' && value.trim().length > 0;
};

const riskBadgeClass = (riskLevel: RiskLevel): string => {
  if (riskLevel === 'High') return 'text-red-700 bg-red-100';
  if (riskLevel === 'Medium') return 'text-amber-700 bg-amber-100';
  return 'text-green-700 bg-green-100';
};

const isPartnerInvitationsTableMissing = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === 'PGRST205' ||
    Boolean(err?.message?.includes("Could not find the table 'public.partner_invitations' in the schema cache"))
  );
};

const normalizeSessionQuestionSet = (questionSet: unknown): string[] => {
  if (!Array.isArray(questionSet)) return [];
  return questionSet.filter((entry): entry is string => typeof entry === 'string');
};

export function CompatibilityQuiz({ onNavigate }: QuizProps) {
  const { profile, user, loading } = useAuth();
  const [selfProfile, setSelfProfile] = useState<Profile | null>(profile);

  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<PartnerInvitation[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<PartnerInvitation[]>([]);
  const [sessions, setSessions] = useState<CoupleAssessmentSession[]>([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mySubmission, setMySubmission] = useState<CoupleAssessmentSubmission | null>(null);
  const [myResponses, setMyResponses] = useState<Responses>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savingSubmission, setSavingSubmission] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const sessionQuestions = useMemo(() => {
    if (!selectedSession) return defaultQuestionSet();

    const ids = normalizeSessionQuestionSet(selectedSession.question_set);
    if (ids.length > 0) {
      const questions = getQuestionsByIds(ids);
      if (questions.length > 0) return questions;
    }

    return defaultQuestionSet();
  }, [selectedSession]);

  const pendingPartnerSession = useMemo(() => {
    if (!profile) return null;
    return (
      sessions.find(
        (session) => session.status === 'pending_partner' && session.initiator_id !== profile.id
      ) || null
    );
  }, [sessions, profile]);

  const isMyTurnToAnswer = Boolean(
    selectedSession && selectedSession.status !== 'completed' && !mySubmission
  );

  useEffect(() => {
    setSelfProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!user || !profile) return;

    void loadPartnerAndInvites();
    void loadSessions();

    const interval = window.setInterval(() => {
      void loadPartnerAndInvites();
      void loadSessions();
      if (selectedSessionId) {
        void loadMySubmission(selectedSessionId);
      }
    }, 12000);

    return () => window.clearInterval(interval);
  }, [user, profile, selectedSessionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }

    if (selectedSessionId && sessions.some((session) => session.id === selectedSessionId)) {
      return;
    }

    setSelectedSessionId(sessions[0].id);
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMySubmission(null);
      setMyResponses({});
      setCurrentQuestionIndex(0);
      return;
    }

    setMySubmission(null);
    setMyResponses({});
    setCurrentQuestionIndex(0);
    void loadMySubmission(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (mySubmission?.responses) {
      setMyResponses(mySubmission.responses);
    }
  }, [mySubmission]);

  const loadPartnerAndInvites = async () => {
    if (!profile) return;

    try {
      const selfRes = await supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle();

      const latestProfile = (selfRes.data as Profile | null) || profile;
      setSelfProfile(latestProfile);

      if (latestProfile.partner_id) {
        const partnerRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', latestProfile.partner_id)
          .maybeSingle();
        setPartnerProfile((partnerRes.data as Profile | null) || null);
      } else {
        setPartnerProfile(null);
      }

      const [incomingRes, outgoingRes] = await Promise.all([
        supabase
          .from('partner_invitations')
          .select('*')
          .eq('status', 'pending')
          .ilike('invitee_email', latestProfile.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('partner_invitations')
          .select('*')
          .eq('inviter_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (incomingRes.error) throw incomingRes.error;
      if (outgoingRes.error) throw outgoingRes.error;

      setIncomingInvites((incomingRes.data || []) as PartnerInvitation[]);
      setOutgoingInvites((outgoingRes.data || []) as PartnerInvitation[]);
    } catch (error) {
      if (isPartnerInvitationsTableMissing(error)) {
        setIncomingInvites([]);
        setOutgoingInvites([]);
        setMessage(
          'Partner invitation feature is not ready yet. Please run the latest Supabase migrations and refresh.'
        );
      }
      console.error('Error loading partner and invitations:', error);
    }
  };

  const loadSessions = async () => {
    if (!profile) return;

    if (!selfProfile?.partner_id) {
      setSessions([]);
      setSelectedSessionId(null);
      setMySubmission(null);
      setMyResponses({});
      setCurrentQuestionIndex(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('couple_assessment_sessions')
        .select('*')
        .or(`partner_a_id.eq.${profile.id},partner_b_id.eq.${profile.id}`)
        .order('initiated_at', { ascending: false });

      if (error) throw error;

      setSessions((data || []) as CoupleAssessmentSession[]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMySubmission = async (sessionId: string) => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('couple_assessment_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', profile.id)
        .maybeSingle();
      setMySubmission((data as CoupleAssessmentSubmission | null) || null);
    } catch (error) {
      console.error('Error loading submission:', error);
      setMySubmission(null);
    }
  };

  const sendInvitation = async () => {
    if (!profile || !selfProfile || !inviteEmail.trim() || selfProfile.partner_id) return;

    setBusyAction('invite');
    setMessage(null);

    try {
      const normalizedEmail = inviteEmail.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(normalizedEmail)) {
        setMessage('Please enter a valid email address.');
        return;
      }

      if (normalizedEmail === selfProfile.email.toLowerCase()) {
        setMessage('You cannot invite your own account.');
        return;
      }

      const { error } = await supabase.rpc('create_partner_invitation', {
        invitee_email_input: normalizedEmail,
      });

      if (error) {
        const rpcMissing =
          error.code === 'PGRST202' ||
          error.message?.includes('Could not find the function public.create_partner_invitation');
        if (!rpcMissing) throw error;

        const { data: existingInvite, error: existingInviteError } = await supabase
          .from('partner_invitations')
          .select('id')
          .eq('inviter_id', profile.id)
          .eq('status', 'pending')
          .eq('invitee_email', normalizedEmail)
          .maybeSingle();

        if (isPartnerInvitationsTableMissing(existingInviteError)) {
          setMessage(
            'Partner invitation feature is not ready yet. Please run the latest Supabase migrations and refresh.'
          );
          return;
        }

        if (existingInviteError) throw existingInviteError;

        if (!existingInvite) {
          const { error: insertInviteError } = await supabase.from('partner_invitations').insert({
            inviter_id: profile.id,
            invitee_email: normalizedEmail,
          });

          if (isPartnerInvitationsTableMissing(insertInviteError)) {
            setMessage(
              'Partner invitation feature is not ready yet. Please run the latest Supabase migrations and refresh.'
            );
            return;
          }

          if (insertInviteError) throw insertInviteError;
        }
      }

      setInviteEmail('');
      setMessage('Invitation sent. Once accepted, you will be connected as partners.');
      await loadPartnerAndInvites();
    } catch (error) {
      if (isPartnerInvitationsTableMissing(error)) {
        setMessage(
          'Partner invitation feature is not ready yet. Please run the latest Supabase migrations and refresh.'
        );
      } else {
        const err = error as { message?: string };
        setMessage(err.message || 'Could not send invitation. Please check the email and try again.');
      }
      console.error('Error sending invitation:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!profile) return;
    setBusyAction(`accept-${invitationId}`);
    setMessage(null);
    try {
      const { error } = await supabase.rpc('accept_partner_invitation', { invitation_id: invitationId });

      if (error) {
        const rpcMissing =
          error.code === 'PGRST202' ||
          error.message?.includes('Could not find the function public.accept_partner_invitation');

        if (!rpcMissing) throw error;

        // Fallback: direct table updates
        // 1. Fetch the invitation
        const { data: inv, error: invErr } = await supabase
          .from('partner_invitations')
          .select('*')
          .eq('id', invitationId)
          .maybeSingle();

        if (invErr) throw invErr;
        if (!inv) throw new Error('Invitation not found.');

        // 2. Fetch the inviter to verify existence
        const { data: inviterProfile, error: inviterErr } = await supabase
          .from('profiles')
          .select('id, partner_id')
          .eq('id', inv.inviter_id)
          .maybeSingle();

        if (inviterErr) throw inviterErr;
        if (!inviterProfile) throw new Error('Inviter not found.');

        // 3. Connect profiles
        const { error: updateSelfErr } = await supabase
          .from('profiles')
          .update({ partner_id: inviterProfile.id })
          .eq('id', profile.id);
        if (updateSelfErr) throw updateSelfErr;

        const { error: updatePartnerErr } = await supabase
          .from('profiles')
          .update({ partner_id: profile.id })
          .eq('id', inviterProfile.id);
        if (updatePartnerErr) throw updatePartnerErr;

        // 4. Mark invitation as accepted
        const { error: statusErr } = await supabase
          .from('partner_invitations')
          .update({ status: 'accepted', responded_at: new Date().toISOString() })
          .eq('id', invitationId);
        if (statusErr) throw statusErr;
      }

      setMessage('Partner connected successfully. You can now start private couple assessments.');
      await loadPartnerAndInvites();
      await loadSessions();
    } catch (error) {
      setMessage('Unable to accept this invitation. The inviter may already be connected.');
      console.error('Error accepting invitation:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    setBusyAction(`decline-${invitationId}`);
    setMessage(null);
    try {
      const { error } = await supabase.rpc('decline_partner_invitation', { invitation_id: invitationId });

      if (error) {
        const rpcMissing =
          error.code === 'PGRST202' ||
          error.message?.includes('Could not find the function public.decline_partner_invitation');
        if (!rpcMissing) throw error;

        // Fallback: directly update standard invitations table
        const { error: fallbackErr } = await supabase
          .from('partner_invitations')
          .update({ status: 'declined', responded_at: new Date().toISOString() })
          .eq('id', invitationId)
          .eq('status', 'pending');

        if (fallbackErr) throw fallbackErr;
      }

      setMessage('Invitation declined.');
      await loadPartnerAndInvites();
    } catch (error) {
      setMessage('Unable to decline invitation right now.');
      console.error('Error declining invitation:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setBusyAction(`cancel-${invitationId}`);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('partner_invitations')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('id', invitationId)
        .eq('status', 'pending');

      if (error) throw error;
      setMessage('Invitation cancelled.');
      await loadPartnerAndInvites();
    } catch (error) {
      setMessage('Unable to cancel invitation.');
      console.error('Error cancelling invitation:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const disconnectPartner = async () => {
    if (!profile) return;
    setBusyAction('disconnect');
    setMessage(null);

    try {
      const currentPartnerId = partnerProfile?.id || selfProfile?.partner_id;

      setPartnerProfile(null);
      setSessions([]);
      setSelectedSessionId(null);
      setMySubmission(null);
      setMyResponses({});
      setCurrentQuestionIndex(0);

      const { error } = await supabase.rpc('disconnect_partner_connection');
      if (error) {
        const rpcMissing =
          error.code === 'PGRST202' ||
          error.message?.includes('Could not find the function public.disconnect_partner_connection');
        if (!rpcMissing) throw error;

        // Fallback: manually update profiles
        const { error: selfUpdateErr } = await supabase
          .from('profiles')
          .update({ partner_id: null })
          .eq('id', profile.id);
        if (selfUpdateErr) throw selfUpdateErr;

        if (currentPartnerId) {
          await supabase
            .from('profiles')
            .update({ partner_id: null })
            .eq('id', currentPartnerId);
        }
      }

      setMessage('Partner connection removed successfully.');
      await loadPartnerAndInvites();
      await loadSessions();
    } catch (error) {
      setMessage('Unable to disconnect at the moment.');
      console.error('Error disconnecting partner:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const startNewSession = async () => {
    if (!profile?.id || !selfProfile?.partner_id) return;

    setBusyAction('start-session');
    setMessage(null);

    try {
      const sessionQuestionSet = selectSessionQuestionSet();
      const { data, error } = await supabase
        .from('couple_assessment_sessions')
        .insert({
          initiator_id: profile.id,
          partner_a_id: profile.id,
          partner_b_id: selfProfile.partner_id,
          status: 'pending_partner',
          question_set: sessionQuestionSet,
        })
        .select('id')
        .single();

      if (error) throw error;

      setMySubmission(null);
      setMyResponses({});
      setCurrentQuestionIndex(0);
      if (data?.id) setSelectedSessionId(data.id);

      setMessage(
        'Assessment started with a random balanced set: 8 MCQ, 5 MSQ, 2 One-line. Your partner received the same set.'
      );
      await loadSessions();
    } catch (error) {
      setMessage('Could not start assessment session.');
      console.error('Error starting session:', error);
    } finally {
      setBusyAction(null);
    }
  };

  const setMCQAnswer = (questionId: string, value: string) => {
    setMyResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleMSQAnswer = (questionId: string, option: string) => {
    setMyResponses((prev) => {
      const selected = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const updated = selected.includes(option)
        ? selected.filter((entry) => entry !== option)
        : [...selected, option];
      return { ...prev, [questionId]: updated };
    });
  };

  const setTextAnswer = (questionId: string, value: string) => {
    setMyResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const canMoveNext = (): boolean => {
    const question = sessionQuestions[currentQuestionIndex];
    if (!question) return false;
    return isQuestionAnswered(question, myResponses[question.id]);
  };

  const isAllAnswered = (): boolean =>
    sessionQuestions.every((question) => isQuestionAnswered(question, myResponses[question.id]));

  const getQuestionMatchAndConfidence = async (
    question: AssessmentQuestion,
    firstValue: ResponseValue,
    secondValue: ResponseValue
  ): Promise<{ match: number; confidence: number }> => {
    if (question.type === 'MCQ') {
      const options = question.options || [];
      const maxDifference = Math.max(options.length - 1, 1);
      const aIndex = Math.max(0, options.indexOf(String(firstValue)));
      const bIndex = Math.max(0, options.indexOf(String(secondValue)));

      const optionDistance = Math.abs(aIndex - bIndex);
      const baseMatch = Math.max(0, 1 - optionDistance / maxDifference);

      const polarityA = maxDifference === 0 ? 1 : 1 - aIndex / maxDifference;
      const polarityB = maxDifference === 0 ? 1 : 1 - bIndex / maxDifference;
      const polarityGap = Math.abs(polarityA - polarityB);
      const polarityMatch = 1 - polarityGap;

      const penalty = polarityGap > 0.66 ? 0.15 : 0;
      const match = Math.max(0, Math.min(1, baseMatch * 0.75 + polarityMatch * 0.25 - penalty));

      if (optionDistance === 0) return { match, confidence: 1 };
      if (optionDistance === maxDifference) return { match, confidence: 0.6 };
      return { match, confidence: 0.85 };
    }

    if (question.type === 'MSQ') {
      const aSet = new Set(Array.isArray(firstValue) ? firstValue : []);
      const bSet = new Set(Array.isArray(secondValue) ? secondValue : []);
      const common = [...aSet].filter((entry) => bSet.has(entry)).length;
      const union = new Set([...aSet, ...bSet]).size;
      const match = union === 0 ? 0 : common / union;

      if (union === 0) return { match: 0, confidence: 0.6 };
      if (common === 0) return { match, confidence: 0.6 };
      if (match < 0.5) return { match, confidence: 0.85 };
      return { match, confidence: 1 };
    }

    const aText = String(firstValue || '');
    const bText = String(secondValue || '');

    let match = await scoreOneLineSimilarityWithGemini(aText, bText);
    if (match === null) {
      match = localOneLineSimilarity(aText, bText);
    }

    const minWords = Math.min(normalizeWords(aText).length, normalizeWords(bText).length);
    if (minWords < 3) return { match, confidence: 0.8 };
    if (match === 0) return { match, confidence: 0.6 };
    return { match, confidence: 1 };
  };

  const computeFinalReport = async (
    firstPartner: Responses,
    secondPartner: Responses,
    questionSet: AssessmentQuestion[]
  ): Promise<FinalReport> => {
    let totalScore = 0;
    let totalWeight = 0;
    let weightedMismatch = 0;
    let weightedMismatchMax = 0;

    const categoryWeightedScore = categoryList.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    const categoryWeightedMax = categoryList.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    const breakdown: QuestionReport[] = [];

    for (const question of questionSet) {
      const first = firstPartner[question.id];
      const second = secondPartner[question.id];
      const { match, confidence } = await getQuestionMatchAndConfidence(question, first, second);

      const weight = question.riskWeight;
      const questionScore = match * weight * confidence;
      const maxQuestionScore = weight * confidence;

      totalScore += questionScore;
      totalWeight += maxQuestionScore;

      const mismatch = 1 - match;
      weightedMismatch += mismatch * weight;
      weightedMismatchMax += weight;

      categoryWeightedScore[question.category] += questionScore;
      categoryWeightedMax[question.category] += maxQuestionScore;

      breakdown.push({
        questionId: question.id,
        sourceQNo: question.sourceQNo,
        category: question.category,
        riskLevel: question.riskLevel,
        type: question.type,
        match,
        confidence,
        weight,
        questionScore,
        maxQuestionScore,
      });
    }

    const categoryScores = categoryList.reduce((acc, category) => {
      const value =
        categoryWeightedMax[category] > 0
          ? categoryWeightedScore[category] / categoryWeightedMax[category]
          : 0;
      acc[category] = toPercent(value);
      return acc;
    }, {} as Record<Category, number>);

    const topRiskContributors = [...breakdown]
      .sort((a, b) => (1 - b.match) * b.weight * b.confidence - (1 - a.match) * a.weight * a.confidence)
      .slice(0, 5)
      .map((entry) => ({
        questionId: entry.questionId,
        sourceQNo: entry.sourceQNo,
        category: entry.category,
        riskLevel: entry.riskLevel,
        riskImpactPercent: toPercent((1 - entry.match) * entry.weight / 3),
      }));

    const overallCompatibility = totalWeight > 0 ? toPercent(totalScore / totalWeight) : 0;
    const weightedRisk = weightedMismatchMax > 0 ? toPercent(weightedMismatch / weightedMismatchMax) : 0;

    const riskFlags = topRiskContributors.map((entry) => {
      const question = questionSet.find((qst) => qst.id === entry.questionId);
      return `Q${entry.sourceQNo} (${question?.category}): ${entry.riskLevel} mismatch (${entry.riskImpactPercent}%)`;
    });

    const mismatches = breakdown
      .filter((entry) => entry.match <= 0.5)
      .sort((a, b) => a.match - b.match)
      .slice(0, 5)
      .map((entry) => {
        const question = questionSet.find((qst) => qst.id === entry.questionId);
        return `Q${entry.sourceQNo} ${question?.prompt || ''} -> match ${toPercent(entry.match)}%`;
      });

    const keyTextAnswers = questionSet
      .filter((question) => question.type === 'One-line')
      .map((question) => {
        const firstText = String(firstPartner[question.id] || '').trim();
        const secondText = String(secondPartner[question.id] || '').trim();
        return `Q${question.sourceQNo}: A="${firstText}" | B="${secondText}"`;
      });

    const aiAnalysis = await generateRelationshipAnalysisWithGemini({
      finalScore: overallCompatibility,
      categoryScores,
      riskFlags,
      mismatches,
      keyTextAnswers,
    });

    return {
      strategy:
        'Score = Match x Weight x Confidence. MCQ includes option-distance and mindset polarity similarity. MSQ uses common/union overlap. One-line uses Gemini semantic scoring with lexical fallback. FinalCompatibility = (TotalScore / TotalWeight) x 100.',
      generated_at: new Date().toISOString(),
      selected_question_numbers: questionSet.map((question) => question.sourceQNo),
      overall_compatibility_percent: overallCompatibility,
      weighted_risk_percent: weightedRisk,
      category_scores: categoryScores,
      top_risk_contributors: topRiskContributors,
      score_breakdown: breakdown,
      ai_analysis: aiAnalysis || undefined,
    };
  };

  const finalizeSessionIfReady = async (session: CoupleAssessmentSession, questionSet: AssessmentQuestion[]) => {
    if (session.status === 'completed') return;

    const { data: allSubmissions } = await supabase
      .from('couple_assessment_submissions')
      .select('*')
      .eq('session_id', session.id);

    const submissions = (allSubmissions || []) as CoupleAssessmentSubmission[];
    if (submissions.length < 2) return;

    const submissionA = submissions.find((entry) => entry.user_id === session.partner_a_id);
    const submissionB = submissions.find((entry) => entry.user_id === session.partner_b_id);
    if (!submissionA || !submissionB) return;

    const report = await computeFinalReport(
      submissionA.responses as Responses,
      submissionB.responses as Responses,
      questionSet
    );

    const updateResult = await supabase
      .from('couple_assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        report,
      })
      .eq('id', session.id)
      .eq('status', 'pending_partner')
      .select('id');

    if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
      return;
    }

    const summaryPayload = {
      source: 'Questions.txt',
      mode: 'private_two_account_assessment',
      session_id: session.id,
      question_count: questionSet.length,
      selected_question_numbers: questionSet.map((question) => question.sourceQNo),
      report_summary: {
        overall_compatibility_percent: report.overall_compatibility_percent,
        weighted_risk_percent: report.weighted_risk_percent,
        category_scores: report.category_scores,
      },
      ai_analysis: report.ai_analysis || null,
    };

    await supabase.from('compatibility_assessments').insert([
      {
        user_id: session.partner_a_id,
        assessment_type: 'advanced',
        values_score: Math.round(
          (report.category_scores.Values + report.category_scores['Life Goals']) / 2
        ),
        lifestyle_score: report.category_scores.Lifestyle,
        communication_score: report.category_scores.Communication,
        total_score: report.overall_compatibility_percent,
        responses: summaryPayload,
      },
      {
        user_id: session.partner_b_id,
        assessment_type: 'advanced',
        values_score: Math.round(
          (report.category_scores.Values + report.category_scores['Life Goals']) / 2
        ),
        lifestyle_score: report.category_scores.Lifestyle,
        communication_score: report.category_scores.Communication,
        total_score: report.overall_compatibility_percent,
        responses: summaryPayload,
      },
    ]);
  };

  const submitMyAssessment = async () => {
    if (!profile || !selectedSession || sessionQuestions.length === 0 || !isAllAnswered()) return;

    setSavingSubmission(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('couple_assessment_submissions').upsert(
        {
          session_id: selectedSession.id,
          user_id: profile.id,
          responses: myResponses,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,user_id' }
      );

      if (error) throw error;

      await finalizeSessionIfReady(selectedSession, sessionQuestions);
      await loadSessions();
      await loadMySubmission(selectedSession.id);

      setMessage(
        'Your answers were submitted privately. The report will generate after both partners submit the same question set.'
      );
    } catch (error) {
      setMessage('Could not submit your answers. Please try again.');
      console.error('Error submitting assessment:', error);
    } finally {
      setSavingSubmission(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="rounded-full h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900/30 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-primary flex items-center justify-center">
        <div className="text-center premium-card p-10 bg-secondary">
          <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium text-lg">Please sign in to access couple assessment.</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center premium-card p-10">
          <p className="text-slate-600 mb-6 font-medium text-lg">Setting up your profile. Please wait and refresh this page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const report = (selectedSession?.report || null) as FinalReport | null;
  const currentQuestion = sessionQuestions[currentQuestionIndex] || null;
  const progress =
    sessionQuestions.length > 0 ? ((currentQuestionIndex + 1) / sessionQuestions.length) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-80px)] py-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="premium-card p-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-900/30">
          <h1 className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-200 mb-3 tracking-tight">Couple Assessment Workspace</h1>
          <p className="text-indigo-800/80 dark:text-indigo-300/80 font-medium">
            Each session uses a random set of 15 questions from the 50-question bank (8 MCQ, 5 MSQ, 2 One-line).
            Both partners get the same set for that session.
          </p>
          {message && <p className="mt-4 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/30 inline-block px-3 py-1.5 rounded-lg">{message}</p>}
        </div>

        <div className="premium-card p-8 bg-secondary transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Link2 size={20} /> Partner Connection
          </h2>

          {partnerProfile ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 p-4">
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">Connected Partner</p>
                <p className="text-emerald-800 dark:text-emerald-400">
                  {partnerProfile!.full_name} ({partnerProfile!.email})
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">
                  One partner connection per account is enforced.
                </p>
              </div>
              <button
                onClick={disconnectPartner}
                disabled={busyAction === 'disconnect'}
                className="inline-flex items-center gap-2 border border-red-600 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-60"
              >
                <Unlink size={16} /> Disconnect Partner
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Invite partner by email</label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="partner@example.com"
                    className="flex-1 border border-slate-300 dark:border-slate-800 bg-primary/50 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendInvitation}
                    disabled={
                      busyAction === 'invite' ||
                      inviteEmail.trim().length === 0 ||
                      Boolean(selfProfile?.partner_id)
                    }
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    <Send size={16} /> Send Invite
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-primary/30">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Incoming Invitations</h3>
                  {incomingInvites.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending invitations.</p>
                  ) : (
                    <div className="space-y-3">
                      {incomingInvites.map((invite) => (
                        <div key={invite.id} className="border rounded-lg p-3">
                          <p className="text-sm text-slate-700 mb-2">Pending partner invitation</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptInvitation(invite.id)}
                              disabled={busyAction === `accept-${invite.id}`}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => declineInvitation(invite.id)}
                              disabled={busyAction === `decline-${invite.id}`}
                              className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-60"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-primary/30">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Outgoing Invitations</h3>
                  {outgoingInvites.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No pending outgoing invitations.</p>
                  ) : (
                    <div className="space-y-3">
                      {outgoingInvites.map((invite) => (
                        <div key={invite.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-secondary/50">
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">To {invite.invitee_email}</p>
                          <button
                            onClick={() => cancelInvitation(invite.id)}
                            disabled={busyAction === `cancel-${invite.id}`}
                            className="border border-red-300 text-red-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!partnerProfile && (
          <div className="premium-card p-8 bg-secondary">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">Assessment Access</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-lg">
              Couple sessions are visible only when a partner connection is active.
            </p>
            <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 px-5 py-4 text-sm font-medium text-indigo-900 dark:text-indigo-300 flex items-start gap-3">
              <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={18} />
              Connect with one partner to unlock session cards, report analysis, and assessment submission.
            </div>
          </div>
        )}

        {partnerProfile && (
          <div className="premium-card p-8 bg-secondary transition-colors duration-300 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <UserPlus className="text-indigo-500" size={24} /> Session Cards
              </h2>
              <button
                onClick={startNewSession}
                disabled={busyAction === 'start-session'}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
              >
                Start New Assessment
              </button>
            </div>

            {pendingPartnerSession && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
                <Bell className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium text-amber-900">
                  Your partner has started a new session. Open that card and submit your private answers.
                </p>
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium">No sessions yet. Start one to notify your partner.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sessions.map((session) => {
                  const sessionReport = (session.report || null) as FinalReport | null;
                  const questionCount = normalizeSessionQuestionSet(session.question_set).length;
                  const completed = session.status === 'completed';

                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`text-left transition-all duration-300 rounded-2xl p-6 ${selectedSessionId === session.id
                        ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md ring-4 ring-indigo-500/10 scale-[1.02]'
                        : 'bg-white border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                        }`}
                    >
                      <div className="flex flex-col h-full justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                              {completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                          <p className="font-extrabold text-slate-900 text-lg">
                            Session {new Date(session.initiated_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                            {questionCount || 15} Questions
                          </p>
                        </div>

                        {completed && sessionReport ? (
                          <div className="mt-4 pt-4 border-t border-slate-200/60">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-500">Compatibility</span>
                              <span className="font-extrabold text-indigo-700">{sessionReport.overall_compatibility_percent}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500">Risk</span>
                              <span className="font-extrabold text-rose-700">{sessionReport.weighted_risk_percent}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-slate-200/60">
                            <p className="text-xs font-medium text-slate-500">Waiting for submissions.</p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {partnerProfile && selectedSession && (
          <div className="premium-card p-8 bg-gradient-to-br from-secondary to-primary relative overflow-hidden transition-colors duration-300">
            {selectedSession.status === 'completed' && report ? (
              <div className="space-y-8 relative z-10">
                <div className="text-center bg-secondary/60 dark:bg-slate-900/40 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur">
                  <CheckCircle className="text-emerald-500 mx-auto mb-4 drop-shadow-md" size={64} />
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Report & Analysis</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mt-2 max-w-lg mx-auto">Only your own answers are stored per account. Matching is used for scoring.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 mb-1">Final Compatibility</p>
                    <p className="text-5xl font-extrabold text-indigo-900 dark:text-indigo-100">{report!.overall_compatibility_percent}%</p>
                  </div>
                  <div className="border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 bg-rose-50 dark:bg-rose-900/20 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-500 rounded-full blur-3xl opacity-20"></div>
                    <p className="text-sm font-bold uppercase tracking-widest text-rose-700 dark:text-rose-300 mb-1">Weighted Risk</p>
                    <p className="text-5xl font-extrabold text-rose-900 dark:text-rose-100">{report!.weighted_risk_percent}%</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 mb-4 text-xl flex items-center gap-2"><Target size={20} className="text-slate-400" /> Category Scores</h4>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryList.map((category) => (
                      <div key={category} className="bg-secondary border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition transition-colors duration-300">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{category}</p>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{report!.category_scores[category]}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 mb-4 text-xl flex items-center gap-2"><ShieldAlert size={20} className="text-rose-500" /> Top Risk Contributors</h4>
                  <div className="space-y-3">
                    {report!.top_risk_contributors.map((riskItem) => {
                      const question = QUESTION_BANK.find((entry) => entry.id === riskItem.questionId);
                      return (
                        <div key={riskItem.questionId} className="bg-secondary border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug flex-1">
                              <span className="text-slate-400 dark:text-slate-500 mr-2">Q{riskItem.sourceQNo}</span> {question?.prompt}
                            </p>
                            <span className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase tracking-widest shrink-0 ${riskBadgeClass(riskItem.riskLevel)}`}>
                              {riskItem.riskLevel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-4 text-sm">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Risk impact:</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded transition-colors">{riskItem.riskImpactPercent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {report!.ai_analysis && typeof report!.ai_analysis === 'object' && (
                  <div className="rounded-[2rem] border border-blue-200 dark:border-blue-900/30 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 mt-8 shadow-sm space-y-6">
                    <h4 className="font-extrabold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-3 text-2xl">
                      <Sparkles size={24} className="text-blue-600 dark:text-blue-400 -mt-1" /> Executive Analysis
                    </h4>

                    {/* Core Insight */}
                    <div className="bg-white/60 dark:bg-slate-900/40 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                      <h5 className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2">Core Insight</h5>
                      <p className="text-blue-900 dark:text-blue-200 font-medium leading-relaxed">{report!.ai_analysis.insight}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Issues */}
                      <div>
                        <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Main Problems</h5>
                        <ul className="space-y-2">
                          {report!.ai_analysis.mainProblems.map((prob, i) => (
                            <li key={i} className="flex gap-2 text-slate-700 dark:text-slate-300 text-sm">
                              <span className="text-rose-500 shrink-0">•</span> {prob}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Precautions */}
                      <div>
                        <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Future Precautions</h5>
                        <ul className="space-y-2">
                          {report!.ai_analysis.futurePrecautions.map((prec, i) => (
                            <li key={i} className="flex gap-2 text-slate-700 dark:text-slate-300 text-sm">
                              <span className="text-amber-500 shrink-0">•</span> {prec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Step By Step */}
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                        <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3">Daily/Weekly Steps</h5>
                        <ul className="space-y-3">
                          {report!.ai_analysis.stepByStepActions.map((action, i) => (
                            <li key={i} className="flex gap-3 text-emerald-900 dark:text-emerald-200 text-sm leading-snug">
                              <span className="font-bold text-emerald-600 dark:text-emerald-500 shrink-0">{i + 1}.</span> {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <h5 className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-3">Recommended Actions</h5>
                        <ul className="space-y-3">
                          {report!.ai_analysis.recommendedActions.map((rec, i) => (
                            <li key={i} className="bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/30 text-blue-950 dark:text-blue-200 text-sm font-medium">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : mySubmission ? (
              <div className="rounded-[2rem] border-2 border-indigo-200 bg-indigo-50 p-10 text-center relative z-10 shadow-sm">
                <CheckCircle className="mx-auto text-indigo-500 mb-4" size={48} />
                <p className="text-2xl font-extrabold text-indigo-900 mb-2">Your private answers are submitted.</p>
                <p className="text-indigo-800/80 font-medium">
                  Waiting for your partner to submit their assessment to generate the report.
                </p>
              </div>
            ) : isMyTurnToAnswer && currentQuestion ? (
              <div className="space-y-8 relative z-10 max-w-4xl mx-auto">
                <div className="bg-secondary rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                    <span>Question {currentQuestionIndex + 1} / {sessionQuestions.length}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-primary/50 rounded-full h-3 overflow-hidden">
                    <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-secondary text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                    {currentQuestion.type}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border ${riskBadgeClass(currentQuestion.riskLevel).replace('bg-', 'border-').replace('text-', 'text-')}`}>
                    {currentQuestion.riskLevel} Risk
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm transition-colors">
                    {currentQuestion.category}
                  </span>
                </div>

                <div className="mt-8 mb-10">
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{currentQuestion.prompt}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">{currentQuestion.riskDescription}</p>
                </div>

                {currentQuestion.type === 'MCQ' && (
                  <div className="grid gap-3">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => setMCQAnswer(currentQuestion.id, option)}
                        className={`w-full border-2 rounded-2xl p-5 text-left transition-all duration-300 font-semibold text-lg ${myResponses[currentQuestion.id] === option
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 shadow-sm ring-4 ring-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-secondary text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:bg-primary/50'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'MSQ' && (
                  <div className="grid gap-3">
                    {currentQuestion.options?.map((option) => {
                      const selected = Array.isArray(myResponses[currentQuestion.id])
                        ? (myResponses[currentQuestion.id] as string[]).includes(option)
                        : false;

                      return (
                        <button
                          key={option}
                          onClick={() => toggleMSQAnswer(currentQuestion.id, option)}
                          className={`w-full border-2 rounded-2xl p-5 text-left transition-all duration-300 font-semibold text-lg ${selected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 shadow-sm ring-4 ring-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-secondary text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:bg-primary/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                              {selected && <CheckCircle size={14} className="text-white" />}
                            </div>
                            {option}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'One-line' && (
                  <textarea
                    value={String(myResponses[currentQuestion.id] || '')}
                    onChange={(event) => setTextAnswer(currentQuestion.id, event.target.value)}
                    placeholder="Type your response thoughtfully..."
                    className="w-full min-h-[160px] border-2 border-slate-200 dark:border-slate-800 bg-secondary rounded-2xl p-5 text-lg font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y shadow-sm"
                  />
                )}

                <div className="flex items-center justify-between pt-10 border-t border-slate-200/60 mt-10">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center gap-2 text-slate-600 bg-white border border-slate-300 shadow-sm px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={18} /> Previous
                  </button>

                  {currentQuestionIndex < sessionQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      disabled={!canMoveNext()}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5"
                    >
                      Next <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={submitMyAssessment}
                      disabled={!isAllAnswered() || savingSubmission}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5"
                    >
                      {savingSubmission ? (
                        <>Submitting <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white ml-2"></div></>
                      ) : (
                        <>Submit Final Answers <CheckCircle size={18} /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 relative z-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-slate-400" />
                </div>
                <p className="text-xl font-bold text-slate-500">Select a pending session card to continue.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
