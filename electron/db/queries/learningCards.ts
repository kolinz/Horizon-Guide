import { getDatabase } from '../database'
import type { LearningCard, OutputCard, LearningType, LearningLocation, LearningModality } from '../../../src/types'

// ────────────────────────────────────────────────
// フェーズ自動判定
// ────────────────────────────────────────────────

/**
 * 開始日・終了日と今日の日付からフェーズを判定する。
 * 日付形式: "YYYY-MM"
 */
export function calcPhase(startDate: string, endDate: string | null): 'past' | 'ongoing' | 'future' {
  const today = new Date()
  // YYYY-MM → その月の1日として比較
  const toDate = (ym: string): Date => {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }

  const start = toDate(startDate)

  if (endDate) {
    // 終了月の末日を終了日とする（月単位の比較）
    const [ey, em] = endDate.split('-').map(Number)
    const end = new Date(ey, em, 0) // 翌月0日 = 当月末日
    if (end < today) return 'past'
  }

  if (start > today) return 'future'

  return 'ongoing'
}

// ────────────────────────────────────────────────
// DB行 → TypeScript型 変換
// ────────────────────────────────────────────────

interface LearningCardRow {
  id: string
  title: string
  start_date: string
  end_date: string | null
  type: string
  location: string | null
  modality: string | null
  phase: string
  is_completed: number
  motivation_level: number | null
  memo: string
  created_at: string
  updated_at: string
}

interface OutputCardRow {
  id: string
  learning_card_id: string
  title: string
  type: string
  url: string | null
  status: string
  created_at: string
  updated_at: string
}

function rowToLearningCard(row: LearningCardRow, outputs: OutputCard[]): LearningCard {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    type: row.type as LearningType,
    location: row.location as LearningLocation | null,
    modality: row.modality as LearningModality | null,
    phase: row.phase as 'past' | 'ongoing' | 'future',
    isCompleted: row.is_completed === 1,
    motivationLevel: row.motivation_level as 1 | 2 | 3 | 4 | 5 | null,
    memo: row.memo,
    outputs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToOutputCard(row: OutputCardRow): OutputCard {
  return {
    id: row.id,
    learningCardId: row.learning_card_id,
    title: row.title,
    type: row.type as OutputCard['type'],
    url: row.url,
    status: row.status as 'done' | 'planned',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────

/**
 * 全学習カードを output_cards と合わせて返す。
 * startDate の昇順、同じ場合は createdAt 昇順でソート。
 */
export function getAllLearningCards(): LearningCard[] {
  const db = getDatabase()

  const cardRows = db
    .prepare(`
      SELECT * FROM learning_cards
      ORDER BY start_date ASC, created_at ASC
    `)
    .all() as LearningCardRow[]

  const outputRows = db
    .prepare(`
      SELECT * FROM output_cards
      ORDER BY created_at ASC
    `)
    .all() as OutputCardRow[]

  // output_cards を learning_card_id でグループ化
  const outputsByCardId = new Map<string, OutputCard[]>()
  for (const row of outputRows) {
    const output = rowToOutputCard(row)
    const list = outputsByCardId.get(output.learningCardId) ?? []
    list.push(output)
    outputsByCardId.set(output.learningCardId, list)
  }

  return cardRows.map((row) => {
    const outputs = outputsByCardId.get(row.id) ?? []
    return rowToLearningCard(row, outputs)
  })
}

/**
 * 学習カードを INSERT または UPDATE する（id が存在すれば UPDATE）。
 * フェーズは startDate / endDate から自動計算して上書きする。
 */
export function upsertLearningCard(card: LearningCard): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  // フェーズを常に再計算
  const phase = calcPhase(card.startDate, card.endDate)

  db.prepare(`
    INSERT INTO learning_cards (
      id, title, start_date, end_date, type, location, modality,
      phase, is_completed, motivation_level, memo, created_at, updated_at
    ) VALUES (
      @id, @title, @startDate, @endDate, @type, @location, @modality,
      @phase, @isCompleted, @motivationLevel, @memo, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      title            = excluded.title,
      start_date       = excluded.start_date,
      end_date         = excluded.end_date,
      type             = excluded.type,
      location         = excluded.location,
      modality         = excluded.modality,
      phase            = excluded.phase,
      is_completed     = excluded.is_completed,
      motivation_level = excluded.motivation_level,
      memo             = excluded.memo,
      updated_at       = excluded.updated_at
  `).run({
    id: card.id,
    title: card.title,
    startDate: card.startDate,
    endDate: card.endDate ?? null,
    type: card.type,
    location: card.location ?? null,
    modality: card.modality ?? null,
    phase,
    isCompleted: card.isCompleted ? 1 : 0,
    motivationLevel: card.motivationLevel ?? null,
    memo: card.memo,
    createdAt: card.createdAt || now,
    updatedAt: now,
  })
}

/**
 * 学習カードを削除する。
 * output_cards は ON DELETE CASCADE で自動削除される。
 */
export function deleteLearningCard(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM learning_cards WHERE id = ?').run(id)
}

/**
 * モチベーションレベルのみを更新する。
 * null を渡すと未設定状態に戻る。
 */
export function updateMotivationLevel(id: string, level: number | null): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE learning_cards
    SET motivation_level = ?, updated_at = ?
    WHERE id = ?
  `).run(level ?? null, now, id)
}

/**
 * 全カードのフェーズを今日の日付で再計算して更新する。
 * アプリ起動時や日付変更時に呼ぶことを想定。
 */
export function recalcAllPhases(): void {
  const db = getDatabase()

  const cards = db
    .prepare('SELECT id, start_date, end_date FROM learning_cards')
    .all() as { id: string; start_date: string; end_date: string | null }[]

  const update = db.prepare(`
    UPDATE learning_cards SET phase = ?, updated_at = ? WHERE id = ?
  `)

  const now = new Date().toISOString()

  const updateAll = db.transaction(() => {
    for (const card of cards) {
      const phase = calcPhase(card.start_date, card.end_date)
      update.run(phase, now, card.id)
    }
  })

  updateAll()
}
