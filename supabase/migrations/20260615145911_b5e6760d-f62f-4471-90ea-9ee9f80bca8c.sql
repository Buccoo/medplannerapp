
CREATE TABLE public.daily_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_priorities TO authenticated;
GRANT ALL ON public.daily_priorities TO service_role;

ALTER TABLE public.daily_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own priorities"
ON public.daily_priorities FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_daily_priorities_updated_at
BEFORE UPDATE ON public.daily_priorities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
