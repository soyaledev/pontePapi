-- Mercado Pago OAuth: tokens por barbería para Split Payments
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS mp_user_id TEXT;
