-- Cloudflare D1 Schema for Absolute Custom Installations (ACI) v2.0

CREATE TABLE IF NOT EXISTS gallery_state (
  id TEXT PRIMARY KEY, -- 'draft' or 'published'
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  service TEXT NOT NULL,
  property_type TEXT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS private_media_tokens (
  token TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_inquiry ON private_media_tokens(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expiry ON private_media_tokens(expires_at);

-- Additive tables: safe to apply to an existing v2 database.
-- 'accepted' means Resend accepted the request; it does NOT mean delivered.
CREATE TABLE IF NOT EXISTS email_notifications (
  inquiry_id TEXT PRIMARY KEY REFERENCES inquiries(id),
  status TEXT NOT NULL CHECK(status IN ('pending','accepted','failed')),
  provider_id TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS inquiry_rate_limits (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_expiry ON inquiry_rate_limits(expires_at);
