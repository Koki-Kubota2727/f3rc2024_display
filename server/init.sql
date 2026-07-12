-- match_state テーブル作成
CREATE TABLE IF NOT EXISTS match_state (
  id               SERIAL PRIMARY KEY,
  left_university  TEXT    DEFAULT '',
  right_university TEXT    DEFAULT '',
  left_score       INTEGER DEFAULT 0,
  right_score      INTEGER DEFAULT 0,
  left_pine        INTEGER DEFAULT 0,
  right_pine       INTEGER DEFAULT 0,
  left_choco       INTEGER DEFAULT 0,
  right_choco      INTEGER DEFAULT 0,
  left_bread       INTEGER DEFAULT 0,
  right_bread      INTEGER DEFAULT 0,
  left_bon         BOOLEAN DEFAULT FALSE,
  right_bon        BOOLEAN DEFAULT FALSE,
  timer_state      INTEGER DEFAULT 1,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ挿入
INSERT INTO match_state (id) VALUES (1) ON CONFLICT DO NOTHING;
