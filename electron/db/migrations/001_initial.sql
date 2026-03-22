-- Migration 001: 初期スキーマ
-- schema.sql と同内容。migrate.ts から呼ばれる。

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,
  user_name   TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS ai_history (
  id                  TEXT PRIMARY KEY,
  mode                TEXT NOT NULL,
  user_message        TEXT,
  ai_response         TEXT NOT NULL,
  provider            TEXT NOT NULL,
  model_or_endpoint   TEXT,
  timestamp           TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  goal_type       TEXT NOT NULL,
  previous_value  TEXT,
  new_value       TEXT NOT NULL,
  timestamp       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL
);
