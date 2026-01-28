-- Migration: Initial schema
-- Created: 2025

-- families（家族）
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- events（確定済みの予定）
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- ideas_trips（旅行アイデア）
CREATE TABLE ideas_trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- ideas_monthly_events（月単位の予定アイデア）
CREATE TABLE ideas_monthly_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- blocked_periods（ブロック期間）
CREATE TABLE blocked_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- destinations（行き先ストック）
CREATE TABLE destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  required_days INTEGER NOT NULL,
  is_done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- Indexes
CREATE INDEX idx_events_family ON events(family_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_type ON events(family_id, event_type);

CREATE INDEX idx_ideas_trips_family ON ideas_trips(family_id);
CREATE INDEX idx_ideas_trips_month ON ideas_trips(year, month);

CREATE INDEX idx_ideas_monthly_events_family ON ideas_monthly_events(family_id);
CREATE INDEX idx_ideas_monthly_events_month ON ideas_monthly_events(year, month);

CREATE INDEX idx_blocked_periods_family ON blocked_periods(family_id);
CREATE INDEX idx_blocked_periods_dates ON blocked_periods(start_date, end_date);

CREATE INDEX idx_destinations_family ON destinations(family_id);
