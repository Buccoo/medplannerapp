CREATE TABLE public.microarea_company_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  microarea TEXT NOT NULL,
  cycle_index INTEGER NOT NULL,
  company_target INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, microarea, cycle_index)
);

ALTER TABLE public.microarea_company_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ma company targets" ON public.microarea_company_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ma company targets" ON public.microarea_company_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ma company targets" ON public.microarea_company_targets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ma company targets" ON public.microarea_company_targets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_ma_company_targets_updated_at
BEFORE UPDATE ON public.microarea_company_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();