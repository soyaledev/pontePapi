-- Tabla para tokens de verificación de correo (verificación propia, no Supabase)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para marcar usuarios que ya verificaron (evitar bloquear usuarios existentes)
CREATE TABLE IF NOT EXISTS owner_email_verified (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por token
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

-- Migrar usuarios existentes que ya tienen barberías como verificados (compatibilidad)
INSERT INTO owner_email_verified (user_id, verified_at)
SELECT DISTINCT owner_id, NOW()
FROM barbershops
ON CONFLICT (user_id) DO NOTHING;

-- RLS: bloquea acceso desde anon/authenticated; service_role (API) bypasea RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_email_verified ENABLE ROW LEVEL SECURITY;
