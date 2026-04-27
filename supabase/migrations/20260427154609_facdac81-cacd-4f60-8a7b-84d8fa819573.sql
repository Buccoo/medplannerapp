-- Add cycle target overrides to products
ALTER TABLE public.products
ADD COLUMN cycle_targets_override jsonb NOT NULL DEFAULT '[null, null, null, null]'::jsonb;

-- Create microarea_targets table
CREATE TABLE public.microarea_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  microarea text NOT NULL,
  cycle_index integer NOT NULL CHECK (cycle_index >= 0 AND cycle_index <= 3),
  month_index integer NOT NULL CHECK (month_index >= 0 AND month_index <= 2),
  target integer NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, microarea, cycle_index, month_index)
);

ALTER TABLE public.microarea_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own microarea targets"
ON public.microarea_targets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own microarea targets"
ON public.microarea_targets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own microarea targets"
ON public.microarea_targets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own microarea targets"
ON public.microarea_targets FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_microarea_targets_updated_at
BEFORE UPDATE ON public.microarea_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_microarea_targets_lookup ON public.microarea_targets(user_id, product_id, microarea, cycle_index);