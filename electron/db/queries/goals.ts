import { getDatabase } from '../database'
import type { CareerGoal, WellbeingGoal } from '../../../src/types'

// ────────────────────────────────────────────────
// キャリアゴール
// ────────────────────────────────────────────────

interface CareerGoalRow {
  id: string
  text: string
  target_date: string | null
  user_name: string | null
  created_at: string
  updated_at: string
}

function rowToCareerGoal(row: CareerGoalRow): CareerGoal {
  return {
    id: row.id,
    text: row.text,
    targetDate: row.target_date,
    userName: row.user_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * キャリアゴールを取得する（最新の1件）。
 * 未設定の場合は null を返す。
 */
export function getCareerGoal(): CareerGoal | null {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM career_goals ORDER BY updated_at DESC LIMIT 1')
    .get() as CareerGoalRow | undefined
  return row ? rowToCareerGoal(row) : null
}

/**
 * キャリアゴールを保存する（存在すれば UPDATE、なければ INSERT）。
 */
export function saveCareerGoal(goal: CareerGoal): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO career_goals (id, text, target_date, user_name, created_at, updated_at)
    VALUES (@id, @text, @targetDate, @userName, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      text        = excluded.text,
      target_date = excluded.target_date,
      user_name   = excluded.user_name,
      updated_at  = excluded.updated_at
  `).run({
    id: goal.id,
    text: goal.text,
    targetDate: goal.targetDate ?? null,
    userName: goal.userName ?? null,
    createdAt: goal.createdAt || now,
    updatedAt: now,
  })
}

// ────────────────────────────────────────────────
// ウェルビーイングゴール
// ────────────────────────────────────────────────

interface WellbeingGoalRow {
  id: string
  text: string
  personal_axis: string | null
  social_axis: string | null
  planet_axis: string | null
  ai_generated: number
  created_at: string
  updated_at: string
}

function rowToWellbeingGoal(row: WellbeingGoalRow): WellbeingGoal {
  return {
    id: row.id,
    text: row.text,
    axes: {
      personal: row.personal_axis,
      social: row.social_axis,
      planet: row.planet_axis,
    },
    aiGenerated: row.ai_generated === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * ウェルビーイングゴールを取得する（最新の1件）。
 * 未設定の場合は null を返す。
 */
export function getWellbeingGoal(): WellbeingGoal | null {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM wellbeing_goals ORDER BY updated_at DESC LIMIT 1')
    .get() as WellbeingGoalRow | undefined
  return row ? rowToWellbeingGoal(row) : null
}

/**
 * ウェルビーイングゴールを保存する（存在すれば UPDATE、なければ INSERT）。
 */
export function saveWellbeingGoal(goal: WellbeingGoal): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO wellbeing_goals (
      id, text, personal_axis, social_axis, planet_axis, ai_generated, created_at, updated_at
    ) VALUES (
      @id, @text, @personalAxis, @socialAxis, @planetAxis, @aiGenerated, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      text          = excluded.text,
      personal_axis = excluded.personal_axis,
      social_axis   = excluded.social_axis,
      planet_axis   = excluded.planet_axis,
      ai_generated  = excluded.ai_generated,
      updated_at    = excluded.updated_at
  `).run({
    id: goal.id,
    text: goal.text,
    personalAxis: goal.axes.personal ?? null,
    socialAxis: goal.axes.social ?? null,
    planetAxis: goal.axes.planet ?? null,
    aiGenerated: goal.aiGenerated ? 1 : 0,
    createdAt: goal.createdAt || now,
    updatedAt: now,
  })
}
