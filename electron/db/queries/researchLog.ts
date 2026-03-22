import { getDatabase } from '../database'
import type {
  ActionLogEntry,
  MotivationLogEntry,
  GoalLogEntry,
  SessionLogEntry,
} from '../../../src/types'

// ────────────────────────────────────────────────
// action_log
// ────────────────────────────────────────────────

/**
 * カード操作ログを記録する。
 * id / timestamp は自動生成するため、入力から除外している。
 */
export function insertActionLog(
  entry: Omit<ActionLogEntry, 'id' | 'timestamp'>
): void {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO action_log (
      id, event_type, target_type, target_id, target_title,
      before_value, after_value, timestamp
    ) VALUES (
      @id, @eventType, @targetType, @targetId, @targetTitle,
      @beforeValue, @afterValue, @timestamp
    )
  `).run({
    id: crypto.randomUUID(),
    eventType: entry.eventType,
    targetType: entry.targetType,
    targetId: entry.targetId,
    targetTitle: entry.targetTitle,
    beforeValue: entry.beforeValue ?? null,
    afterValue: entry.afterValue ?? null,
    timestamp: new Date().toISOString(),
  })
}

/**
 * カード操作ログを全件取得する（古い順）。
 */
export function getAllActionLogs(): ActionLogEntry[] {
  const db = getDatabase()

  const rows = db
    .prepare('SELECT * FROM action_log ORDER BY timestamp ASC')
    .all() as {
      id: string
      event_type: string
      target_type: string
      target_id: string
      target_title: string
      before_value: string | null
      after_value: string | null
      timestamp: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type as ActionLogEntry['eventType'],
    targetType: row.target_type as ActionLogEntry['targetType'],
    targetId: row.target_id,
    targetTitle: row.target_title,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    timestamp: row.timestamp,
  }))
}

// ────────────────────────────────────────────────
// motivation_log
// ────────────────────────────────────────────────

/**
 * モチベーション変化ログを記録する。
 */
export function insertMotivationLog(
  entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>
): void {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO motivation_log (
      id, learning_card_id, learning_card_title,
      previous_level, new_level, timestamp
    ) VALUES (
      @id, @learningCardId, @learningCardTitle,
      @previousLevel, @newLevel, @timestamp
    )
  `).run({
    id: crypto.randomUUID(),
    learningCardId: entry.learningCardId,
    learningCardTitle: entry.learningCardTitle,
    previousLevel: entry.previousLevel ?? null,
    newLevel: entry.newLevel,
    timestamp: new Date().toISOString(),
  })
}

/**
 * モチベーションログを全件取得する（古い順）。
 */
export function getAllMotivationLogs(): MotivationLogEntry[] {
  const db = getDatabase()

  const rows = db
    .prepare('SELECT * FROM motivation_log ORDER BY timestamp ASC')
    .all() as {
      id: string
      learning_card_id: string
      learning_card_title: string
      previous_level: number | null
      new_level: number
      timestamp: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    learningCardId: row.learning_card_id,
    learningCardTitle: row.learning_card_title,
    previousLevel: row.previous_level as MotivationLogEntry['previousLevel'],
    newLevel: row.new_level as MotivationLogEntry['newLevel'],
    timestamp: row.timestamp,
  }))
}

// ────────────────────────────────────────────────
// goal_log
// ────────────────────────────────────────────────

/**
 * ゴール設定・変更ログを記録する。
 */
export function insertGoalLog(
  entry: Omit<GoalLogEntry, 'id' | 'timestamp'>
): void {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO goal_log (
      id, event_type, goal_type, previous_value, new_value, timestamp
    ) VALUES (
      @id, @eventType, @goalType, @previousValue, @newValue, @timestamp
    )
  `).run({
    id: crypto.randomUUID(),
    eventType: entry.eventType,
    goalType: entry.goalType,
    previousValue: entry.previousValue ?? null,
    newValue: entry.newValue,
    timestamp: new Date().toISOString(),
  })
}

/**
 * ゴールログを全件取得する（古い順）。
 */
export function getAllGoalLogs(): GoalLogEntry[] {
  const db = getDatabase()

  const rows = db
    .prepare('SELECT * FROM goal_log ORDER BY timestamp ASC')
    .all() as {
      id: string
      event_type: string
      goal_type: string
      previous_value: string | null
      new_value: string
      timestamp: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type as GoalLogEntry['eventType'],
    goalType: row.goal_type as GoalLogEntry['goalType'],
    previousValue: row.previous_value,
    newValue: row.new_value,
    timestamp: row.timestamp,
  }))
}

// ────────────────────────────────────────────────
// session_log
// ────────────────────────────────────────────────

/**
 * セッションログ（アプリ起動・終了）を記録する。
 */
export function insertSessionLog(
  eventType: 'app_launched' | 'app_closed'
): void {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO session_log (id, event_type, timestamp)
    VALUES (@id, @eventType, @timestamp)
  `).run({
    id: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
  })
}

/**
 * セッションログを全件取得する（古い順）。
 */
export function getAllSessionLogs(): SessionLogEntry[] {
  const db = getDatabase()

  const rows = db
    .prepare('SELECT * FROM session_log ORDER BY timestamp ASC')
    .all() as {
      id: string
      event_type: string
      timestamp: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type as 'app_launched' | 'app_closed',
    timestamp: row.timestamp,
  }))
}
