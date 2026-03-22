import { getDatabase } from '../database'

// ────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────

export interface AIHistoryEntry {
  id: string
  mode: 'chat' | 'analyze'
  userMessage: string | null
  aiResponse: string
  provider: 'llm' | 'dify' | 'langflow'
  modelOrEndpoint: string | null
  timestamp: string
}

interface AIHistoryRow {
  id: string
  mode: string
  user_message: string | null
  ai_response: string
  provider: string
  model_or_endpoint: string | null
  timestamp: string
}

function rowToEntry(row: AIHistoryRow): AIHistoryEntry {
  return {
    id: row.id,
    mode: row.mode as 'chat' | 'analyze',
    userMessage: row.user_message,
    aiResponse: row.ai_response,
    provider: row.provider as AIHistoryEntry['provider'],
    modelOrEndpoint: row.model_or_endpoint,
    timestamp: row.timestamp,
  }
}

// ────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────

/**
 * AI助言履歴を追加する。
 */
export function insertAIHistory(entry: AIHistoryEntry): void {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO ai_history (
      id, mode, user_message, ai_response, provider, model_or_endpoint, timestamp
    ) VALUES (
      @id, @mode, @userMessage, @aiResponse, @provider, @modelOrEndpoint, @timestamp
    )
  `).run({
    id: entry.id,
    mode: entry.mode,
    userMessage: entry.userMessage ?? null,
    aiResponse: entry.aiResponse,
    provider: entry.provider,
    modelOrEndpoint: entry.modelOrEndpoint ?? null,
    timestamp: entry.timestamp,
  })
}

/**
 * AI助言履歴を全件取得する（新しい順）。
 */
export function getAllAIHistory(): AIHistoryEntry[] {
  const db = getDatabase()

  const rows = db
    .prepare('SELECT * FROM ai_history ORDER BY timestamp DESC')
    .all() as AIHistoryRow[]

  return rows.map(rowToEntry)
}

/**
 * AI助言履歴を全件削除する（データ初期化時）。
 */
export function clearAIHistory(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM ai_history').run()
}
