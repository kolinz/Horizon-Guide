-- Horizon Guide — 初期マイグレーション
-- migration: 001_initial
-- HG-SDD-001 v0.9.8

-- キャリアゴール
CREATE TABLE IF NOT EXISTS career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,
  user_name   TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ウェルビーイングゴール（OECD 2030対応）
CREATE TABLE IF NOT EXISTS wellbeing_goals (
  id             TEXT PRIMARY KEY,
  text           TEXT NOT NULL,
  personal_axis  TEXT,
  social_axis    TEXT,
  planet_axis    TEXT,
  ai_generated   INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- 学習者プロフィール（FR-19）
-- レコードは常に1行のみ（id='profile' 固定でupsert）
CREATE TABLE IF NOT EXISTS user_profile (
  id              TEXT PRIMARY KEY,
  learner_type    TEXT,
  academic_field  TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 学問分野マスタ（FR-19）
CREATE TABLE IF NOT EXISTS academic_field_master (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1
);

-- 学問分野の初期データ（既に存在する場合はスキップ）
INSERT OR IGNORE INTO academic_field_master (id, label, sort_order, is_active) VALUES
  ('none',        'なし',          1, 1),
  ('informatics', '情報学',        2, 1),
  ('business',    '経営学',        3, 1),
  ('sociology',   '社会学',        4, 1),
  ('anime_manga', 'アニメ・マンガ', 5, 1),
  ('other',       'その他',        6, 1);

-- 学習カード（親）
CREATE TABLE IF NOT EXISTS learning_cards (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  type             TEXT NOT NULL,
  location         TEXT,
  modality         TEXT,
  phase            TEXT NOT NULL,
  is_completed     INTEGER NOT NULL DEFAULT 0,
  motivation_level INTEGER,
  memo             TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- アウトプットカード（子）
CREATE TABLE IF NOT EXISTS output_cards (
  id               TEXT PRIMARY KEY,
  learning_card_id TEXT NOT NULL REFERENCES learning_cards(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,
  url              TEXT,
  status           TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- AI助言履歴
CREATE TABLE IF NOT EXISTS ai_history (
  id                  TEXT PRIMARY KEY,
  mode                TEXT NOT NULL,
  user_message        TEXT,
  ai_response         TEXT NOT NULL,
  provider            TEXT NOT NULL,
  model_or_endpoint   TEXT,
  timestamp           TEXT NOT NULL
);

-- 研究用：カード操作ログ
CREATE TABLE IF NOT EXISTS action_log (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  target_title  TEXT NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  timestamp     TEXT NOT NULL
);

-- 研究用：モチベーション変化ログ
CREATE TABLE IF NOT EXISTS motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

-- 研究用：ゴール設定ログ
CREATE TABLE IF NOT EXISTS goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  goal_type       TEXT NOT NULL,
  previous_value  TEXT,
  new_value       TEXT NOT NULL,
  timestamp       TEXT NOT NULL
);

-- 研究用：セッションログ
CREATE TABLE IF NOT EXISTS session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL
);
