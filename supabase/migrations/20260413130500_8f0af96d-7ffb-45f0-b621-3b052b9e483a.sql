
CREATE TABLE public.microarea_towns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  microarea TEXT NOT NULL,
  town TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, microarea, town)
);

ALTER TABLE public.microarea_towns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own microarea towns"
ON public.microarea_towns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own microarea towns"
ON public.microarea_towns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own microarea towns"
ON public.microarea_towns FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_microarea_towns_user ON public.microarea_towns(user_id, microarea);
