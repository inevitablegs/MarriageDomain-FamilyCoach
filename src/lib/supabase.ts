import { createClient } from '@supabase/supabase-js';

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthSession = {
  user: AuthUser;
};

type AuthStateChangeCallback = (_event: string, session: AuthSession | null) => void;

type LocalStoredUser = {
  id: string;
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
};

type LocalDatabase = {
  profiles: Profile[];
  compatibility_assessments: CompatibilityAssessment[];
  red_flags: RedFlag[];
  relationship_health: RelationshipHealth[];
  partner_invitations: PartnerInvitation[];
  couple_assessment_sessions: CoupleAssessmentSession[];
  couple_assessment_submissions: CoupleAssessmentSubmission[];
  discussion_sessions: Array<Record<string, unknown>>;
  conflict_resolution_sessions: ConflictResolutionSession[];
  pulse_check_sessions: PulseCheckSession[];
  bookings: Booking[];
  mentors: Mentor[];
  mentor_assignments: MentorAssignment[];
  chat_messages: ChatMessage[];
  relationship_stress_tests: RelationshipStressTest[];
  need_to_know_chats: NeedToKnowChatSession[];
};

type QueryResult<T> = Promise<{ data: T; error: Error | null }>;

type FilterOp = {
  kind: 'eq' | 'ilike';
  column: string;
  value: unknown;
};

const USE_LOCAL_DB = String(import.meta.env.VITE_USE_LOCAL_DB ?? 'true').toLowerCase() !== 'false';
const DB_KEY = 'marriagewise_local_db_v1';
const USERS_KEY = 'marriagewise_local_users_v1';
const SESSION_KEY = 'marriagewise_local_session_v1';

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultDb(): LocalDatabase {
  return {
    profiles: [],
    compatibility_assessments: [],
    red_flags: [],
    relationship_health: [],
    partner_invitations: [],
    couple_assessment_sessions: [],
    couple_assessment_submissions: [],
    discussion_sessions: [],
    conflict_resolution_sessions: [],
    pulse_check_sessions: [],
    bookings: [],
    mentors: [],
    mentor_assignments: [],
    chat_messages: [],
    relationship_stress_tests: [],
    need_to_know_chats: [],
  };
}

function toAuthUser(user: LocalStoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

function toSession(user: LocalStoredUser): AuthSession {
  return { user: toAuthUser(user) };
}

class LocalQueryBuilder {
  private readonly tableName: keyof LocalDatabase;
  private readonly action: 'select' | 'insert' | 'update' | 'upsert';
  private readonly payload?: unknown;
  private selectColumns: string | null = null;
  private filters: FilterOp[] = [];
  private orGroups: Array<Array<{ column: string; value: string }>> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleMode: 'none' | 'single' | 'maybeSingle' = 'none';

  constructor(tableName: keyof LocalDatabase, action: 'select' | 'insert' | 'update' | 'upsert', payload?: unknown) {
    this.tableName = tableName;
    this.action = action;
    this.payload = payload;
  }

  select(columns: string) {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: 'eq', column, value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ kind: 'ilike', column, value });
    return this;
  }

  or(expression: string) {
    const chunks = expression.split(',').map((x) => x.trim()).filter(Boolean);
    const group = chunks
      .map((chunk) => {
        const parts = chunk.split('.eq.');
        if (parts.length !== 2) return null;
        return { column: parts[0], value: parts[1] };
      })
      .filter((x): x is { column: string; value: string } => Boolean(x));

    if (group.length > 0) this.orGroups.push(group);
    return this;
  }

  order(column: string, options: { ascending: boolean }) {
    this.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  then<TResult1 = { data: unknown; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): QueryResult<unknown> {
    try {
      const db = readJson(DB_KEY, defaultDb());
      const table = (db[this.tableName] as Array<Record<string, unknown>>) || [];

      let workingRows = [...table];

      if (this.action === 'insert') {
        const payloadRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted = payloadRows.map((row) => {
          const source = (row || {}) as Record<string, unknown>;
          return {
            id: (source.id as string) || id(),
            created_at: (source.created_at as string) || nowIso(),
            updated_at: (source.updated_at as string) || nowIso(),
            ...source,
          };
        });

        db[this.tableName] = [...table, ...inserted] as never;
        writeJson(DB_KEY, db);
        workingRows = inserted;
      }

      if (this.action === 'update') {
        const payload = (this.payload || {}) as Record<string, unknown>;
        const updatedRows: Array<Record<string, unknown>> = [];

        db[this.tableName] = table.map((row) => {
          if (this.matches(row)) {
            const updated = { ...row, ...payload, updated_at: nowIso() };
            updatedRows.push(updated);
            return updated;
          }
          return row;
        }) as never;

        writeJson(DB_KEY, db);
        workingRows = updatedRows;
      }

      if (this.action === 'upsert') {
        const payloadRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const mergedRows: Array<Record<string, unknown>> = [];

        const next = [...table];
        for (const raw of payloadRows) {
          const row = (raw || {}) as Record<string, unknown>;
          const rowId = String(row.id || '');
          const existingIndex = next.findIndex((item) => String(item.id || '') === rowId && rowId.length > 0);

          if (existingIndex >= 0) {
            const updated = { ...next[existingIndex], ...row, updated_at: nowIso() };
            next[existingIndex] = updated;
            mergedRows.push(updated);
          } else {
            const inserted = {
              id: rowId || id(),
              created_at: (row.created_at as string) || nowIso(),
              updated_at: (row.updated_at as string) || nowIso(),
              ...row,
            };
            next.push(inserted);
            mergedRows.push(inserted);
          }
        }

        db[this.tableName] = next as never;
        writeJson(DB_KEY, db);
        workingRows = mergedRows;
      }

      if (this.action === 'select') {
        workingRows = workingRows.filter((row) => this.matches(row));
      } else {
        workingRows = workingRows.filter((row) => this.matches(row));
      }

      if (this.orderBy) {
        const { column, ascending } = this.orderBy;
        workingRows.sort((a, b) => {
          const av = a[column];
          const bv = b[column];
          if (av === bv) return 0;
          if (av === undefined || av === null) return ascending ? -1 : 1;
          if (bv === undefined || bv === null) return ascending ? 1 : -1;
          return String(av).localeCompare(String(bv), undefined, { numeric: true }) * (ascending ? 1 : -1);
        });
      }

      if (this.limitCount !== null) {
        workingRows = workingRows.slice(0, this.limitCount);
      }

      const selectedRows = this.applySelectColumns(workingRows);

      if (this.singleMode === 'single') {
        if (selectedRows.length !== 1) {
          return Promise.resolve({ data: null, error: new Error('Expected a single row') });
        }
        return Promise.resolve({ data: selectedRows[0], error: null });
      }

      if (this.singleMode === 'maybeSingle') {
        if (selectedRows.length > 1) {
          return Promise.resolve({ data: null, error: new Error('Expected zero or one row') });
        }
        return Promise.resolve({ data: selectedRows[0] || null, error: null });
      }

      return Promise.resolve({ data: selectedRows, error: null });
    } catch (error) {
      return Promise.resolve({ data: null, error: error as Error });
    }
  }

  private matches(row: Record<string, unknown>) {
    const filterOk = this.filters.every((filter) => {
      const value = row[filter.column];
      if (filter.kind === 'eq') return String(value ?? '') === String(filter.value ?? '');
      if (filter.kind === 'ilike') {
        return String(value ?? '').toLowerCase() === String(filter.value ?? '').toLowerCase();
      }
      return true;
    });

    const orOk =
      this.orGroups.length === 0 ||
      this.orGroups.some((group) => group.some((item) => String(row[item.column] ?? '') === item.value));

    return filterOk && orOk;
  }

  private applySelectColumns(rows: Array<Record<string, unknown>>) {
    if (!this.selectColumns || this.selectColumns.trim() === '*') return rows;

    const columns = this.selectColumns
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    return rows.map((row) => {
      const picked: Record<string, unknown> = {};
      for (const column of columns) picked[column] = row[column];
      return picked;
    });
  }
}

function createLocalSupabase() {
  const listeners = new Set<AuthStateChangeCallback>();

  const notify = (event: string, session: AuthSession | null) => {
    for (const listener of listeners) listener(event, session);
  };

  const getUsers = () => readJson<LocalStoredUser[]>(USERS_KEY, []);
  const setUsers = (users: LocalStoredUser[]) => writeJson(USERS_KEY, users);
  const getSession = () => readJson<AuthSession | null>(SESSION_KEY, null);
  const setSession = (session: AuthSession | null) => {
    writeJson(SESSION_KEY, session);
    notify(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  };

  const rpc = async (fnName: string, params?: Record<string, unknown>) => {
    try {
      const session = getSession();
      const authUserId = session?.user?.id;
      if (!authUserId) return { data: null, error: new Error('Authentication required') };

      const db = readJson(DB_KEY, defaultDb());
      const profiles = db.profiles as Array<Profile>;
      const self = profiles.find((entry) => entry.id === authUserId);
      if (!self) return { data: null, error: new Error('Profile not found') };

      if (fnName === 'create_partner_invitation') {
        const invitee = String(params?.invitee_email_input || '').trim().toLowerCase();
        if (!invitee) return { data: null, error: new Error('Invitee email is required') };

        const exists = db.partner_invitations.find(
          (entry) =>
            entry.inviter_id === authUserId &&
            entry.invitee_email.toLowerCase() === invitee &&
            entry.status === 'pending'
        );

        if (!exists) {
          db.partner_invitations.push({
            id: id(),
            inviter_id: authUserId,
            invitee_email: invitee,
            status: 'pending',
            created_at: nowIso(),
            responded_at: null,
          });
        }

        writeJson(DB_KEY, db);
        return { data: null, error: null };
      }

      if (fnName === 'accept_partner_invitation') {
        const invitationId = String(params?.invitation_id || '');
        const invitation = db.partner_invitations.find((entry) => entry.id === invitationId && entry.status === 'pending');
        if (!invitation) return { data: null, error: new Error('Invitation not found') };

        if (invitation.invitee_email.toLowerCase() !== String(self.email || '').toLowerCase()) {
          return { data: null, error: new Error('Invitation does not match your account email') };
        }

        const inviterProfile = profiles.find((entry) => entry.id === invitation.inviter_id);
        if (!inviterProfile) return { data: null, error: new Error('Inviter profile not found') };
        if (inviterProfile.partner_id || self.partner_id) {
          return { data: null, error: new Error('One of the users is already connected') };
        }

        inviterProfile.partner_id = self.id;
        inviterProfile.updated_at = nowIso();
        self.partner_id = inviterProfile.id;
        self.updated_at = nowIso();

        invitation.status = 'accepted';
        invitation.responded_at = nowIso();
        writeJson(DB_KEY, db);
        return { data: null, error: null };
      }

      if (fnName === 'decline_partner_invitation') {
        const invitationId = String(params?.invitation_id || '');
        const invitation = db.partner_invitations.find((entry) => entry.id === invitationId && entry.status === 'pending');
        if (!invitation) return { data: null, error: new Error('Invitation not found') };

        invitation.status = 'declined';
        invitation.responded_at = nowIso();
        writeJson(DB_KEY, db);
        return { data: null, error: null };
      }

      if (fnName === 'disconnect_partner_connection') {
        const partner = profiles.find((entry) => entry.id === self.partner_id);
        if (partner) {
          partner.partner_id = undefined;
          partner.updated_at = nowIso();
        }
        self.partner_id = undefined;
        self.updated_at = nowIso();
        writeJson(DB_KEY, db);
        return { data: null, error: null };
      }

      return { data: null, error: new Error(`RPC function not implemented: ${fnName}`) };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: getSession() }, error: null }),
      onAuthStateChange: (callback: AuthStateChangeCallback) => {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(callback);
              },
            },
          },
        };
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
      }) => {
        const users = getUsers();
        const normalizedEmail = email.trim().toLowerCase();
        if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
          return { data: { user: null, session: null }, error: new Error('User already registered') };
        }

        const user: LocalStoredUser = {
          id: id(),
          email: normalizedEmail,
          password,
          user_metadata: options?.data || {},
          created_at: nowIso(),
        };

        users.push(user);
        setUsers(users);

        const session = toSession(user);
        setSession(session);

        return {
          data: {
            user: toAuthUser(user),
            session,
          },
          error: null,
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const users = getUsers();
        const normalizedEmail = email.trim().toLowerCase();
        const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password);
        if (!user) {
          return { data: { user: null, session: null }, error: new Error('Invalid login credentials') };
        }

        const session = toSession(user);
        setSession(session);
        return { data: { user: toAuthUser(user), session }, error: null };
      },
      signOut: async () => {
        setSession(null);
        return { error: null };
      },
      getUser: async () => {
        const session = getSession();
        return { data: { user: session?.user || null }, error: null };
      },
    },
    from: (tableName: keyof LocalDatabase) => ({
      select: (columns: string) => new LocalQueryBuilder(tableName, 'select').select(columns),
      insert: (payload: unknown) => new LocalQueryBuilder(tableName, 'insert', payload),
      update: (payload: unknown) => new LocalQueryBuilder(tableName, 'update', payload),
      upsert: (payload: unknown) => new LocalQueryBuilder(tableName, 'upsert', payload),
    }),
    rpc,
  };
}

const remoteUrl = import.meta.env.VITE_SUPABASE_URL;
const remoteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = USE_LOCAL_DB
  ? (createLocalSupabase() as never)
  : createClient(
    (() => {
      if (!remoteUrl) throw new Error('Missing VITE_SUPABASE_URL');
      return remoteUrl;
    })(),
    (() => {
      if (!remoteKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');
      return remoteKey;
    })()
  );

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  relationship_status: 'single' | 'engaged' | 'married';
  role: 'user' | 'mentor' | 'admin';
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
  improvements?: string;
  journal_entry?: string;
  recorded_at: string;
  created_at: string;
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

export type ConflictResolutionSession = {
  id: string;
  user_id: string;
  conflict_type: string;
  severity_level: 'critical' | 'moderate' | 'mild';
  report: Record<string, unknown>; // Will hold the AI ConflictResolutionReport JSON
  created_at: string;
};

export type PulseCheckSession = {
  id: string;
  initiator_id: string;
  partner_id: string;
  status: 'pending_partner' | 'completed';
  initiator_responses: Record<string, unknown> | null;
  partner_responses: Record<string, unknown> | null;
  report: Record<string, unknown> | null;
  created_at: string;
  completed_at?: string;
};

export type Mentor = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialization: string;
  bio: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MentorAssignment = {
  id: string;
  user_id: string;
  mentor_id: string;
  assigned_at: string;
  status: 'active' | 'inactive';
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  assignment_id: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export type RelationshipStressTest = {
  id: string;
  user_id: string;
  risk_score: number;
  breaking_points: string[];
  expectation_gaps: Array<{ domain: string; gap: string }>;
  blind_spots: string[];
  action_plan: Array<{ title: string; task: string }>;
  created_at: string;
};

export type NeedToKnowChatSession = {
  id: string;
  user_id: string;
  category_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>;
  updated_at: string;
};
