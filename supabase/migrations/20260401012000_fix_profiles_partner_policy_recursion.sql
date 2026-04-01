-- Fix recursive RLS policy on profiles when loading connected partner.
-- Previous policy used a subquery on profiles inside profiles policy, causing 42P17.

DROP POLICY IF EXISTS "Users can view connected partner profile" ON profiles;

CREATE POLICY "Users can view connected partner profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());
