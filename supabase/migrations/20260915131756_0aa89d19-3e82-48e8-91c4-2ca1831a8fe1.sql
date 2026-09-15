revoke all on function public.audit_owned_row() from public, anon, authenticated;
revoke all on function public.protect_locked_appointment() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_new_user_settings() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.jsonb_diff(jsonb, jsonb) from public, anon;
revoke all on function public.has_role(uuid, app_role) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.jsonb_diff(jsonb, jsonb) to authenticated;