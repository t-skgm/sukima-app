-- 記念日テーブル（年を持たず月日のみ保存、カレンダー取得時に年展開）
CREATE TABLE IF NOT EXISTS anniversaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT NOT NULL REFERENCES families(id),
  title TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anniversaries_family_id ON anniversaries(family_id);

-- eventsテーブルからanniversaryレコードをanniversariesテーブルに移行
-- 各anniversary eventの最も古いレコード(月日)を1件だけ移行する
INSERT INTO anniversaries (family_id, title, month, day, memo, created_at, updated_at)
SELECT
  family_id,
  title,
  CAST(SUBSTR(start_date, 6, 2) AS INTEGER) AS month,
  CAST(SUBSTR(start_date, 9, 2) AS INTEGER) AS day,
  memo,
  created_at,
  updated_at
FROM events
WHERE event_type = 'anniversary'
  AND id IN (
    SELECT MIN(id)
    FROM events
    WHERE event_type = 'anniversary'
    GROUP BY family_id, title, SUBSTR(start_date, 6)
  );

-- eventsテーブルからanniversaryレコードを削除
DELETE FROM events WHERE event_type = 'anniversary';
