import { getDatabase } from '../database'
import type { OutputCard } from '../../../src/types'

/**
 * アウトプットカードを INSERT または UPDATE する。
 */
export function upsertOutputCard(card: OutputCard): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO output_cards (
      id, learning_card_id, title, type, url, status, created_at, updated_at
    ) VALUES (
      @id, @learningCardId, @title, @type, @url, @status, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      title            = excluded.title,
      type             = excluded.type,
      url              = excluded.url,
      status           = excluded.status,
      updated_at       = excluded.updated_at
  `).run({
    id: card.id,
    learningCardId: card.learningCardId,
    title: card.title,
    type: card.type,
    url: card.url ?? null,
    status: card.status,
    createdAt: card.createdAt || now,
    updatedAt: now,
  })
}

/**
 * アウトプットカードを削除する。
 */
export function deleteOutputCard(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM output_cards WHERE id = ?').run(id)
}

/**
 * 特定の学習カードに紐づくアウトプットカードを全件取得する。
 */
export function getOutputCardsByLearningCardId(learningCardId: string): OutputCard[] {
  const db = getDatabase()

  const rows = db
    .prepare(`
      SELECT * FROM output_cards
      WHERE learning_card_id = ?
      ORDER BY created_at ASC
    `)
    .all(learningCardId) as {
      id: string
      learning_card_id: string
      title: string
      type: string
      url: string | null
      status: string
      created_at: string
      updated_at: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    learningCardId: row.learning_card_id,
    title: row.title,
    type: row.type as OutputCard['type'],
    url: row.url,
    status: row.status as 'done' | 'planned',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}
