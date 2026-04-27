
-- Folders
CREATE TABLE public.archive_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.archive_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.archive_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select folders" ON public.archive_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert folders" ON public.archive_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update folders" ON public.archive_folders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete folders" ON public.archive_folders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_archive_folders_updated BEFORE UPDATE ON public.archive_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Files
CREATE TABLE public.archive_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.archive_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.archive_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select files" ON public.archive_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert files" ON public.archive_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update files" ON public.archive_files FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete files" ON public.archive_files FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_archive_files_updated BEFORE UPDATE ON public.archive_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('archive', 'archive', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "archive own select" ON storage.objects FOR SELECT
  USING (bucket_id = 'archive' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "archive own insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'archive' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "archive own update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'archive' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "archive own delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'archive' AND auth.uid()::text = (storage.foldername(name))[1]);
