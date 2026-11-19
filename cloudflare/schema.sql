CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  used_at TEXT,
  used_by_device TEXT,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT 'Dispositivo autorizado',
  created_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_invites_code_hash ON invites(code_hash);
CREATE INDEX IF NOT EXISTS idx_devices_token_hash ON devices(token_hash);
