
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can see their own role
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin function to get all users with their profiles and subscriptions
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  zona TEXT,
  sub_status TEXT,
  plan_type TEXT,
  current_period_end TIMESTAMPTZ,
  doctors_count BIGINT,
  pharmacies_count BIGINT,
  appointments_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email::TEXT,
    u.created_at,
    us.display_name,
    us.zona,
    s.status AS sub_status,
    s.plan_type,
    s.current_period_end,
    (SELECT COUNT(*) FROM public.doctors d WHERE d.user_id = u.id) AS doctors_count,
    (SELECT COUNT(*) FROM public.pharmacies p WHERE p.user_id = u.id) AS pharmacies_count,
    (SELECT COUNT(*) FROM public.appointments a WHERE a.user_id = u.id) AS appointments_count
  FROM auth.users u
  LEFT JOIN public.user_settings us ON us.user_id = u.id
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
