
-- 1) Remove user-controlled write access on subscriptions; only service_role (which bypasses RLS) can write
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 2) Lock down user_roles with explicit deny-by-default for INSERT/UPDATE/DELETE.
-- service_role bypasses RLS, so admin assignment can still be done server-side.
CREATE POLICY "Deny role inserts from clients"
  ON public.user_roles FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Deny role updates from clients"
  ON public.user_roles FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny role deletes from clients"
  ON public.user_roles FOR DELETE TO authenticated, anon
  USING (false);

-- 3) Restrict admin_get_all_users execution: it already checks has_role internally,
-- but there's no reason to expose it to anon. Revoke from anon.
REVOKE EXECUTE ON FUNCTION public.admin_get_all_users() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
