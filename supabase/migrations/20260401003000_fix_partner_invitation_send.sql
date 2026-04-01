-- Harden invitation creation with server-side validation and duplicate handling.

CREATE OR REPLACE FUNCTION create_partner_invitation(invitee_email_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inviter uuid := auth.uid();
  v_inviter_email text;
  v_inviter_partner uuid;
  v_invitee_email text;
  v_invitee_id uuid;
  v_invitee_partner uuid;
  v_existing_invite uuid;
  v_new_invite uuid;
BEGIN
  IF v_inviter IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_invitee_email := lower(trim(coalesce(invitee_email_input, '')));

  IF v_invitee_email = '' THEN
    RAISE EXCEPTION 'Please enter a valid email address';
  END IF;

  IF v_invitee_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address';
  END IF;

  SELECT email, partner_id INTO v_inviter_email, v_inviter_partner
  FROM profiles
  WHERE id = v_inviter;

  IF v_inviter_email IS NULL THEN
    RAISE EXCEPTION 'Your profile was not found';
  END IF;

  IF v_inviter_partner IS NOT NULL THEN
    RAISE EXCEPTION 'Disconnect your current partner before inviting someone else';
  END IF;

  IF lower(v_inviter_email) = v_invitee_email THEN
    RAISE EXCEPTION 'You cannot invite your own account';
  END IF;

  SELECT id, partner_id INTO v_invitee_id, v_invitee_partner
  FROM profiles
  WHERE lower(email) = v_invitee_email
  LIMIT 1;

  IF v_invitee_partner IS NOT NULL THEN
    RAISE EXCEPTION 'This account is already connected to a partner';
  END IF;

  SELECT id INTO v_existing_invite
  FROM partner_invitations
  WHERE inviter_id = v_inviter
    AND status = 'pending'
    AND lower(invitee_email) = v_invitee_email
  LIMIT 1;

  IF v_existing_invite IS NOT NULL THEN
    RETURN v_existing_invite;
  END IF;

  INSERT INTO partner_invitations (inviter_id, invitee_email)
  VALUES (v_inviter, v_invitee_email)
  RETURNING id INTO v_new_invite;

  RETURN v_new_invite;
END;
$$;
