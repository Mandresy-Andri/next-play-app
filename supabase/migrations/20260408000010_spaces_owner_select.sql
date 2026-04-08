-- Let space owners always SELECT their own space, independent of space_members.
--
-- Required so `INSERT ... RETURNING *` works for new spaces. Without this,
-- the RETURNING clause evaluates the SELECT policy (`is_space_member(id)`)
-- against the new row before the AFTER INSERT trigger's owner-membership row
-- is visible to the executor, producing a spurious
-- "new row violates row-level security policy for table spaces" error.
--
-- This is a permissive SELECT policy, OR'd with `spaces: members can select`.
create policy "spaces: owner can select"
  on public.spaces for select
  using ((select auth.uid()) = owner_id);
