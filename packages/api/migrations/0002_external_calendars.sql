-- Migration: 外部カレンダー連携
-- 外部iCalカレンダー（Google Calendar等）をインポートして同期する機能

-- external_calendars（同期元カレンダー定義）
CREATE TABLE external_calendars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ical_url TEXT NOT NULL,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- external_events（外部カレンダーから取り込んだ予定）
CREATE TABLE external_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  external_calendar_id INTEGER NOT NULL,
  uid TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (external_calendar_id) REFERENCES external_calendars(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_external_calendars_family ON external_calendars(family_id);

CREATE INDEX idx_external_events_family ON external_events(family_id);
CREATE INDEX idx_external_events_calendar ON external_events(external_calendar_id);
CREATE INDEX idx_external_events_dates ON external_events(start_date, end_date);
CREATE UNIQUE INDEX idx_external_events_uid ON external_events(external_calendar_id, uid);
