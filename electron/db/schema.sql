-- Horizon Guide — SQLiteスキーマ定義
-- HG-SDD-001 v0.9.8

-- キャリアゴール
CREATE TABLE IF NOT EXISTS career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,             -- "2027-03" 形式
  user_name   TEXT,             -- PDF用氏名（任意）
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
  ai_generated   INTEGER NOT NULL DEFAULT 0,  -- 0=手動, 1=AI提案
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- 学習者プロフィール（FR-19）
-- レコードは常に1行のみ（id='profile' 固定でupsert）
CREATE TABLE IF NOT EXISTS user_profile (
  id              TEXT PRIMARY KEY,
  learner_type    TEXT,   -- working_adult/professional_univ/university/vocational/high_school, NULL=未設定
  academic_field  TEXT,   -- academic_field_master.id を参照, NULL=未設定
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 学問区分マスタ（FR-19）
-- 選択肢をDBで管理することで、コード変更なしに追加・無効化が可能
CREATE TABLE IF NOT EXISTS academic_field_master (
  id          TEXT PRIMARY KEY,          -- 識別子（例: 'informatics'）
  label       TEXT NOT NULL,             -- 表示名（例: '情報学'）
  sort_order  INTEGER NOT NULL,          -- 表示順（昇順）
  is_active   INTEGER NOT NULL DEFAULT 1 -- 1=表示, 0=非表示（論理削除）
);

-- 学習カード（親）
CREATE TABLE IF NOT EXISTS learning_cards (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  start_date       TEXT NOT NULL,   -- "2024-04"
  end_date         TEXT,            -- NULL = 終了未定
  type             TEXT NOT NULL,   -- class/self_study/training/certificate/other
  location         TEXT,            -- home/university/workplace/cafe/library/online/other, NULL=未設定
  modality         TEXT,            -- in_person/hybrid/hyflex/online, NULL=未設定
  phase            TEXT NOT NULL,   -- past/ongoing/future（自動判定）
  is_completed     INTEGER NOT NULL DEFAULT 0,
  motivation_level INTEGER,         -- 1〜5, NULL=未設定
  memo             TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- アウトプットカード（子）
CREATE TABLE IF NOT EXISTS output_cards (
  id               TEXT PRIMARY KEY,
  learning_card_id TEXT NOT NULL REFERENCES learning_cards(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,   -- article/repository/certificate/presentation/project/other
  url              TEXT,
  status           TEXT NOT NULL,   -- done/planned
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- AI助言履歴
CREATE TABLE IF NOT EXISTS ai_history (
  id                  TEXT PRIMARY KEY,
  mode                TEXT NOT NULL,   -- chat/analyze
  user_message        TEXT,
  ai_response         TEXT NOT NULL,
  provider            TEXT NOT NULL,   -- llm/dify/langflow/local
  model_or_endpoint   TEXT,
  timestamp           TEXT NOT NULL
);

-- 研究用：カード操作ログ
CREATE TABLE IF NOT EXISTS action_log (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,   -- card_created/card_updated/card_deleted/card_completed/card_imported/output_created/output_updated/output_deleted
  target_type   TEXT NOT NULL,   -- learning_card/output_card
  target_id     TEXT NOT NULL,
  target_title  TEXT NOT NULL,
  before_value  TEXT,            -- JSON文字列（変更前）
  after_value   TEXT,            -- JSON文字列（変更後）
  timestamp     TEXT NOT NULL
);

-- 研究用：モチベーション変化ログ
CREATE TABLE IF NOT EXISTS motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,         -- NULL=初回設定
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

-- 研究用：ゴール設定ログ
CREATE TABLE IF NOT EXISTS goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,   -- goal_created/goal_updated
  goal_type       TEXT NOT NULL,   -- career/wellbeing
  previous_value  TEXT,            -- JSON文字列（変更前、初回はNULL）
  new_value       TEXT NOT NULL,   -- JSON文字列（変更後）
  timestamp       TEXT NOT NULL
);

-- 研究用：セッションログ
CREATE TABLE IF NOT EXISTS session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,   -- app_launched/app_closed
  timestamp   TEXT NOT NULL
);
