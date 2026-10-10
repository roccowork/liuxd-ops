-- 联系表单留言表：wrangler d1 execute liuxd-ops --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  company    TEXT,
  contact    TEXT NOT NULL,
  message    TEXT NOT NULL,
  ip         TEXT,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
