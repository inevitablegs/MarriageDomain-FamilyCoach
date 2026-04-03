import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle,
  FileText,
  Link2,
  Send,
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
  ai_analysis?: string;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to access couple assessment.</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Setting up your profile. Please wait and refresh this page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
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
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Couple Assessment Workspace</h1>
          <p className="text-slate-600">
            Each session uses a random set of 15 questions from the 50-question bank (8 MCQ, 5 MSQ, 2 One-line).
            Both partners get the same set for that session.
          </p>
          {message && <p className="mt-3 text-sm font-medium text-blue-700">{message}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Link2 size={20} /> Partner Connection
          </h2>

          {partnerProfile ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-900">Connected Partner</p>
                <p className="text-emerald-800">
                  {partnerProfile.full_name} ({partnerProfile.email})
                </p>
                <p className="text-xs text-emerald-700 mt-1">
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Invite partner by email</label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="partner@example.com"
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Incoming Invitations</h3>
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

                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Outgoing Invitations</h3>
                  {outgoingInvites.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending outgoing invitations.</p>
                  ) : (
                    <div className="space-y-3">
                      {outgoingInvites.map((invite) => (
                        <div key={invite.id} className="border rounded-lg p-3">
                          <p className="text-sm text-slate-700 mb-2">To {invite.invitee_email}</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Assessment Access</h2>
            <p className="text-slate-600 mb-3">
              Couple sessions are visible only when a partner connection is active.
            </p>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
              Connect with one partner to unlock session cards, report analysis, and assessment submission.
            </div>
          </div>
        )}

        {partnerProfile && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={20} /> Session Cards
              </h2>
              <button
                onClick={startNewSession}
                disabled={busyAction === 'start-session'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                Start New Assessment
              </button>
            </div>

            {pendingPartnerSession && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
                <Bell className="text-amber-700 mt-0.5" size={18} />
                <p className="text-sm text-amber-900">
                  Your partner has started a new session. Open that card and submit your private answers.
                </p>
              </div>
            )}

            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No sessions yet. Start one to notify your partner.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {sessions.map((session) => {
                  const sessionReport = (session.report || null) as FinalReport | null;
                  const questionCount = normalizeSessionQuestionSet(session.question_set).length;
                  const completed = session.status === 'completed';

                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`border rounded-xl p-4 text-left transition ${selectedSessionId === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Session {new Date(session.initiated_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Questions: {questionCount || 15} (8 MCQ, 5 MSQ, 2 One-line)
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                          {completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      {completed && sessionReport ? (
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-slate-700">
                            Compatibility: <span className="font-bold">{sessionReport.overall_compatibility_percent}%</span>
                          </p>
                          <p className="text-sm text-slate-700">
                            Risk: <span className="font-bold">{sessionReport.weighted_risk_percent}%</span>
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-600">Waiting for both partner submissions.</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {partnerProfile && selectedSession && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {selectedSession.status === 'completed' && report ? (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="text-emerald-500 mx-auto mb-3" size={52} />
                  <h3 className="text-2xl font-bold text-slate-900">Report & Analysis</h3>
                  <p className="text-slate-600">Only your own answers are stored per account. Matching is used for scoring.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-100">
                    <p className="text-sm text-blue-700">Final Compatibility</p>
                    <p className="text-3xl font-bold text-blue-900">{report.overall_compatibility_percent}%</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-red-50 border-red-100">
                    <p className="text-sm text-red-700">Weighted Risk</p>
                    <p className="text-3xl font-bold text-red-900">{report.weighted_risk_percent}%</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Category Scores</h4>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryList.map((category) => (
                      <div key={category} className="border rounded-lg p-3">
                        <p className="text-sm text-slate-600">{category}</p>
                        <p className="text-xl font-bold text-slate-900">{report.category_scores[category]}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Top Risk Contributors</h4>
                  <div className="space-y-2">
                    {report.top_risk_contributors.map((riskItem) => {
                      const question = QUESTION_BANK.find((entry) => entry.id === riskItem.questionId);
                      return (
                        <div key={riskItem.questionId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-slate-800">
                              Q{riskItem.sourceQNo}: {question?.prompt}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${riskBadgeClass(riskItem.riskLevel)}`}
                            >
                              {riskItem.riskLevel}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">Risk impact: {riskItem.riskImpactPercent}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {report.ai_analysis && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <FileText size={18} /> Professional Analysis
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-6">{report.ai_analysis}</p>
                  </div>
                )}
              </div>
            ) : mySubmission ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <p className="font-semibold text-blue-900 mb-2">Your private answers are submitted.</p>
                <p className="text-sm text-blue-800">
                  Waiting for your partner to submit the same session question set.
                </p>
              </div>
            ) : isMyTurnToAnswer && currentQuestion ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>
                      Question {currentQuestionIndex + 1} of {sessionQuestions.length}
                    </span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {currentQuestion.type}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${riskBadgeClass(
                      currentQuestion.riskLevel
                    )}`}
                  >
                    {currentQuestion.riskLevel} Risk
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {currentQuestion.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{currentQuestion.prompt}</h3>
                  <p className="text-sm text-slate-600 mt-1">{currentQuestion.riskDescription}</p>
                </div>

                {currentQuestion.type === 'MCQ' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => setMCQAnswer(currentQuestion.id, option)}
                        className={`w-full border-2 rounded-lg p-3 text-left transition ${myResponses[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'MSQ' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => {
                      const selected = Array.isArray(myResponses[currentQuestion.id])
                        ? (myResponses[currentQuestion.id] as string[]).includes(option)
                        : false;

                      return (
                        <button
                          key={option}
                          onClick={() => toggleMSQAnswer(currentQuestion.id, option)}
                          className={`w-full border-2 rounded-lg p-3 text-left transition ${selected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                            }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'One-line' && (
                  <textarea
                    value={String(myResponses[currentQuestion.id] || '')}
                    onChange={(event) => setTextAnswer(currentQuestion.id, event.target.value)}
                    placeholder="Type your response"
                    className="w-full min-h-32 border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  />
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center gap-2 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <ArrowLeft size={16} /> Previous
                  </button>

                  {currentQuestionIndex < sessionQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      disabled={!canMoveNext()}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={submitMyAssessment}
                      disabled={!isAllAnswered() || savingSubmission}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {savingSubmission ? 'Submitting...' : 'Submit Private Answers'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Select a pending session card to continue.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
