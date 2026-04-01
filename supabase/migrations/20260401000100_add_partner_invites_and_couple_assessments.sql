-- Partner connection and private couple assessment workflow

-- Extend profile access so partners can read minimal profile data.
CREATE POLICY "Users can view connected partner profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

-- Partner invitations: inviter sends by email, invitee accepts from own account.
CREATE TABLE IF NOT EXISTS partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT partner_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_partner_invitations_inviter_id ON partner_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_invitee_email ON partner_invitations(invitee_email);

CREATE POLICY "Inviter can view own sent invitations"
  ON partner_invitations FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

CREATE POLICY "Invitee can view invitations sent to own email"
  ON partner_invitations FOR SELECT
  TO authenticated
  USING (
    lower(invitee_email) = lower((SELECT email FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Inviter can create invitations"
  ON partner_invitations FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Inviter can update own invitation"
  ON partner_invitations FOR UPDATE
  TO authenticated
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

CREATE OR REPLACE FUNCTION accept_partner_invitation(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inviter uuid;
  v_invitee uuid := auth.uid();
  v_invitee_email text;
  v_inviter_partner uuid;
  v_invitee_partner uuid;
BEGIN
  IF v_invitee IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT email, partner_id INTO v_invitee_email, v_invitee_partner
  FROM profiles
  WHERE id = v_invitee;

  IF v_invitee_email IS NULL THEN
    RAISE EXCEPTION 'Invitee profile not found';
  END IF;

  SELECT inviter_id INTO v_inviter
  FROM partner_invitations
  WHERE id = invitation_id
    AND status = 'pending'
    AND lower(invitee_email) = lower(v_invitee_email);

  IF v_inviter IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already handled';
  END IF;

  IF v_inviter = v_invitee THEN
    RAISE EXCEPTION 'Cannot connect with self';
  END IF;

  SELECT partner_id INTO v_inviter_partner
  FROM profiles
  WHERE id = v_inviter;

  IF v_inviter_partner IS NOT NULL OR v_invitee_partner IS NOT NULL THEN
    RAISE EXCEPTION 'One partner connection is allowed per account';
  END IF;

  UPDATE profiles
  SET partner_id = v_invitee,
      updated_at = now()
  WHERE id = v_inviter;

  UPDATE profiles
  SET partner_id = v_inviter,
      updated_at = now()
  WHERE id = v_invitee;

  UPDATE partner_invitations
  SET status = 'accepted',
      responded_at = now()
  WHERE id = invitation_id;

  -- Cancel all other pending invitations involving either user.
  UPDATE partner_invitations
  SET status = 'cancelled',
      responded_at = now()
  WHERE status = 'pending'
    AND id <> invitation_id
    AND (
      inviter_id IN (v_inviter, v_invitee)
      OR lower(invitee_email) IN (
        lower((SELECT email FROM profiles WHERE id = v_inviter)),
        lower((SELECT email FROM profiles WHERE id = v_invitee))
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION decline_partner_invitation(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = auth.uid();

  UPDATE partner_invitations
  SET status = 'declined',
      responded_at = now()
  WHERE id = invitation_id
    AND status = 'pending'
    AND lower(invitee_email) = lower(v_user_email);
END;
$$;

CREATE OR REPLACE FUNCTION disconnect_partner_connection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_partner uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT partner_id INTO v_partner
  FROM profiles
  WHERE id = v_user;

  IF v_partner IS NULL THEN
    RETURN;
  END IF;

  UPDATE profiles
  SET partner_id = NULL,
      updated_at = now()
  WHERE id IN (v_user, v_partner);
END;
$$;

-- Couple assessment sessions and private submissions.
CREATE TABLE IF NOT EXISTS couple_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_a_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_partner',
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  report jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT session_status_check CHECK (status IN ('pending_partner', 'completed')),
  CONSTRAINT different_partners_check CHECK (partner_a_id <> partner_b_id)
);

ALTER TABLE couple_assessment_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_couple_sessions_partner_a ON couple_assessment_sessions(partner_a_id);
CREATE INDEX IF NOT EXISTS idx_couple_sessions_partner_b ON couple_assessment_sessions(partner_b_id);
CREATE INDEX IF NOT EXISTS idx_couple_sessions_status ON couple_assessment_sessions(status);

CREATE POLICY "Partners can view their sessions"
  ON couple_assessment_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() IN (partner_a_id, partner_b_id));

CREATE POLICY "Connected user can create session"
  ON couple_assessment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    initiator_id = auth.uid()
    AND auth.uid() IN (partner_a_id, partner_b_id)
  );

CREATE POLICY "Partners can update their session"
  ON couple_assessment_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (partner_a_id, partner_b_id))
  WITH CHECK (auth.uid() IN (partner_a_id, partner_b_id));

CREATE TABLE IF NOT EXISTS couple_assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES couple_assessment_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE couple_assessment_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_couple_submissions_session_id ON couple_assessment_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_couple_submissions_user_id ON couple_assessment_submissions(user_id);

CREATE POLICY "Partners can view submissions in their session"
  ON couple_assessment_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM couple_assessment_sessions s
      WHERE s.id = session_id
        AND auth.uid() IN (s.partner_a_id, s.partner_b_id)
    )
  );

CREATE POLICY "Partners can upsert own submission"
  ON couple_assessment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM couple_assessment_sessions s
      WHERE s.id = session_id
        AND auth.uid() IN (s.partner_a_id, s.partner_b_id)
    )
  );

CREATE POLICY "Partners can update own submission"
  ON couple_assessment_submissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
